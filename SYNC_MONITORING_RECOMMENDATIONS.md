# Sync Monitoring Architecture Recommendations

## Executive Summary

The current sync monitoring implementation relies on CloudWatch log parsing, which is fragile and provides limited real-time visibility. This document outlines recommendations for a more robust, event-driven monitoring architecture.

## Current Issues

### 1. Fragile Log Parsing
- Regex-based pattern matching of unstructured logs
- Brittle when log formats change
- Performance overhead from scanning large log volumes
- Difficult maintenance and debugging

### 2. Limited Real-time Visibility
- CloudWatch log ingestion delays (1-5 minutes)
- Polling-based updates create latency
- No direct communication between sync processes

### 3. Incomplete Status Information
- Missing detailed progress tracking
- No granular error categorization
- Limited performance metrics

## Recommended Architecture

### 1. Event-Driven Status Updates

Replace log parsing with structured events using AWS EventBridge:

```typescript
// Event schema for sync status updates
interface SyncStatusEvent {
  source: 'pocketsmith-ynab-sync';
  detailType: 'Sync Status Update' | 'Sync Progress' | 'Sync Error';
  detail: {
    syncId: string;
    timestamp: string;
    status: 'started' | 'in-progress' | 'completed' | 'failed';
    progress?: {
      totalAccounts: number;
      processedAccounts: number;
      totalTransactions: number;
      processedTransactions: number;
      failedTransactions: number;
      duplicatesSkipped: number;
    };
    error?: {
      code: string;
      message: string;
      accountId?: string;
      transactionId?: string;
    };
    metadata: {
      triggeredBy: 'manual' | 'scheduled';
      dateRange?: { start: string; end: string };
      accountFilters?: string[];
    };
  };
}
```

### 2. Real-time Status Store

Use DynamoDB for real-time sync status with TTL:

```typescript
// DynamoDB table schema
interface SyncStatusRecord {
  syncId: string; // Partition key
  timestamp: string; // Sort key
  status: 'started' | 'in-progress' | 'completed' | 'failed';
  progress: SyncProgress;
  error?: SyncError;
  metadata: SyncMetadata;
  ttl: number; // Auto-expire old records after 30 days
}
```

### 3. WebSocket Real-time Updates

Implement WebSocket API for live updates:

```typescript
// WebSocket message types
interface WebSocketMessage {
  type: 'sync-status' | 'sync-progress' | 'sync-error' | 'sync-complete';
  data: SyncStatusEvent['detail'];
}
```

## Implementation Plan

### Phase 1: Event Infrastructure (Week 1-2)

1. **Create EventBridge Custom Bus**
   ```typescript
   const syncEventBus = new events.EventBus(this, 'SyncEventBus', {
     eventBusName: 'pocketsmith-ynab-sync-events'
   });
   ```

2. **DynamoDB Status Table**
   ```typescript
   const syncStatusTable = new dynamodb.Table(this, 'SyncStatusTable', {
     partitionKey: { name: 'syncId', type: dynamodb.AttributeType.STRING },
     sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
     timeToLiveAttribute: 'ttl',
     stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
   });
   ```

3. **Event Processing Lambda**
   - Listen to EventBridge events
   - Update DynamoDB status table
   - Send WebSocket notifications

### Phase 2: Python Sync Integration (Week 2-3)

Modify the Python sync solution to emit structured events:

```python
import boto3
import json
from datetime import datetime

class SyncEventEmitter:
    def __init__(self):
        self.eventbridge = boto3.client('events')
        self.bus_name = 'pocketsmith-ynab-sync-events'
    
    def emit_sync_started(self, sync_id: str, metadata: dict):
        self._emit_event('Sync Status Update', {
            'syncId': sync_id,
            'status': 'started',
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata
        })
    
    def emit_progress_update(self, sync_id: str, progress: dict):
        self._emit_event('Sync Progress', {
            'syncId': sync_id,
            'status': 'in-progress',
            'timestamp': datetime.utcnow().isoformat(),
            'progress': progress
        })
    
    def emit_sync_completed(self, sync_id: str, final_stats: dict):
        self._emit_event('Sync Status Update', {
            'syncId': sync_id,
            'status': 'completed',
            'timestamp': datetime.utcnow().isoformat(),
            'progress': final_stats
        })
```

### Phase 3: WebSocket API (Week 3-4)

1. **API Gateway WebSocket API**
   ```typescript
   const webSocketApi = new apigatewayv2.WebSocketApi(this, 'SyncWebSocketApi', {
     routeSelectionExpression: '$request.body.action',
   });
   ```

2. **Connection Management Lambda**
   - Handle WebSocket connections
   - Manage subscriptions by user/sync ID
   - Send real-time updates

### Phase 4: Frontend Integration (Week 4-5)

1. **WebSocket Hook**
   ```typescript
   const useSyncWebSocket = (syncId?: string) => {
     const [status, setStatus] = useState<SyncStatus | null>(null);
     const [isConnected, setIsConnected] = useState(false);
     
     useEffect(() => {
       const ws = new WebSocket(WEBSOCKET_URL);
       
       ws.onopen = () => {
         setIsConnected(true);
         if (syncId) {
           ws.send(JSON.stringify({ action: 'subscribe', syncId }));
         }
       };
       
       ws.onmessage = (event) => {
         const message: WebSocketMessage = JSON.parse(event.data);
         setStatus(message.data);
       };
       
       return () => ws.close();
     }, [syncId]);
     
     return { status, isConnected };
   };
   ```

2. **Real-time Progress Component**
   ```typescript
   const RealTimeSyncProgress: React.FC<{ syncId: string }> = ({ syncId }) => {
     const { status, isConnected } = useSyncWebSocket(syncId);
     
     return (
       <Card>
         <CardContent>
           <Box display="flex" alignItems="center" gap={2}>
             <CircularProgress 
               variant="determinate" 
               value={status?.progress ? 
                 (status.progress.processedTransactions / status.progress.totalTransactions) * 100 : 0
               } 
             />
             <Box>
               <Typography variant="h6">
                 {status?.progress?.processedTransactions || 0} / {status?.progress?.totalTransactions || 0}
               </Typography>
               <Typography variant="body2" color="text.secondary">
                 Transactions Processed
               </Typography>
             </Box>
           </Box>
         </CardContent>
       </Card>
     );
   };
   ```

## Alternative: Lightweight Improvements

If a full event-driven architecture is too complex, consider these lighter improvements:

### 1. Structured Logging
Replace current log parsing with structured JSON logs:

```python
import json
import logging

# In Python sync solution
def log_sync_progress(sync_id: str, progress: dict):
    structured_log = {
        'event_type': 'sync_progress',
        'sync_id': sync_id,
        'timestamp': datetime.utcnow().isoformat(),
        'progress': progress
    }
    logging.info(json.dumps(structured_log))
```

### 2. CloudWatch Custom Metrics
Emit custom metrics for better monitoring:

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

def emit_sync_metrics(transactions_processed: int, transactions_failed: int):
    cloudwatch.put_metric_data(
        Namespace='PocketSmith/YNAB/Sync',
        MetricData=[
            {
                'MetricName': 'TransactionsProcessed',
                'Value': transactions_processed,
                'Unit': 'Count'
            },
            {
                'MetricName': 'TransactionsFailed',
                'Value': transactions_failed,
                'Unit': 'Count'
            }
        ]
    )
```

### 3. Parameter Store Status Updates
Use Parameter Store for simple status sharing:

```python
import boto3

ssm = boto3.client('ssm')

def update_sync_status(sync_id: str, status: dict):
    ssm.put_parameter(
        Name=f'/pocketsmith-ynab-sync/status/{sync_id}',
        Value=json.dumps(status),
        Type='String',
        Overwrite=True
    )
```

## Benefits of Recommended Approach

### 1. **Reliability**
- No dependency on log parsing
- Structured data with guaranteed schema
- Resilient to format changes

### 2. **Real-time Updates**
- Sub-second latency for status updates
- Live progress tracking during sync operations
- Immediate error notifications

### 3. **Scalability**
- Event-driven architecture scales automatically
- DynamoDB handles high throughput
- WebSocket connections managed efficiently

### 4. **Maintainability**
- Clear separation of concerns
- Structured data models
- Easy to extend and modify

### 5. **User Experience**
- Real-time progress bars
- Immediate feedback on sync operations
- Better error reporting and diagnostics

## Cost Considerations

### EventBridge + DynamoDB + WebSocket API
- **EventBridge**: ~$1/million events
- **DynamoDB**: ~$0.25/million read/write requests
- **WebSocket API**: ~$1/million messages
- **Total estimated cost**: <$50/month for typical usage

### Alternative: CloudWatch + Parameter Store
- **CloudWatch Custom Metrics**: ~$0.30/metric/month
- **Parameter Store**: ~$0.05/10,000 requests
- **Total estimated cost**: <$10/month

## Recommendation

**For immediate improvement**: Implement structured logging and CloudWatch custom metrics (Alternative approach)

**For long-term solution**: Implement full event-driven architecture with WebSocket real-time updates

The event-driven approach provides the best user experience and system reliability, while the alternative approach offers quick wins with minimal changes to existing infrastructure.