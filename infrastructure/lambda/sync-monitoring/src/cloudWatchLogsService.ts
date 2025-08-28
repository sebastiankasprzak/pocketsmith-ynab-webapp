import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SyncHistoryEntry,
  ParsedLogEntry,
  LogEvent,
  EXISTING_LOG_GROUPS,
  getAllSyncLogGroups,
} from './types';

export class CloudWatchLogsService {
  private client: CloudWatchLogsClient;

  constructor(region: string = process.env.AWS_REGION || 'us-east-1') {
    this.client = new CloudWatchLogsClient({ region });
  }

  /**
   * Parse log message to extract sync-related information
   */
  private parseLogMessage(message: string, timestamp: string): ParsedLogEntry | null {
    try {
      // Try to parse as JSON first (structured logging)
      if (message.trim().startsWith('{')) {
        const parsed = JSON.parse(message);
        return {
          timestamp,
          level: parsed.level || 'INFO',
          message: parsed.message || message,
          requestId: parsed.requestId,
          transactionCount: parsed.transactionCount,
          errorDetails: parsed.error,
          duration: parsed.duration,
        };
      }

      // Parse common log patterns - expanded to catch more variations
      const patterns = {
        // Lambda request start/end
        requestStart: /START RequestId: ([a-f0-9-]+)/,
        requestEnd: /END RequestId: ([a-f0-9-]+)/,
        requestReport: /REPORT RequestId: ([a-f0-9-]+).*?Duration: ([\d.]+) ms/,
        
        // Transaction processing patterns - more comprehensive
        transactionsFetched: /(?:Fetched|Retrieved|Found|Got)\s+(\d+)\s+transactions?/i,
        transactionsProcessed: /(?:Processed|Imported|Synced|Updated)\s+(\d+)\s+transactions?/i,
        transactionsFailed: /(?:Failed|Error|Unable)\s+(?:to\s+)?(?:process|import|sync)\s+(\d+)\s+transactions?/i,
        duplicatesSkipped: /(?:Skipped|Ignored|Duplicate)\s+(\d+)\s+(?:duplicate\s+)?transactions?/i,
        
        // Additional transaction patterns
        transactionCount: /(\d+)\s+transactions?\s+(?:successfully\s+)?(?:processed|imported|synced|fetched)/i,
        successfulSync: /(?:Successfully\s+)?(?:synced|imported|processed)\s+(\d+)/i,
        
        // Error patterns - more comprehensive
        error: /(ERROR|Error|error|FAILED|Failed|failed).*?:?\s*(.*)/,
        exception: /(Exception|exception|EXCEPTION).*?:?\s*(.*)/,
        
        // Status patterns - expanded
        syncStarted: /(?:Starting|Begin|Initiating)\s+(?:sync|import|fetch|process)/i,
        syncCompleted: /(?:Sync|Import|Process|Fetch)\s+(?:operation\s+)?(?:completed|finished|done|successful)/i,
        syncFailed: /(?:Sync|Import|Process|Fetch)\s+(?:operation\s+)?(?:failed|error|unsuccessful)/i,
        
        // YNAB specific patterns
        ynabImport: /YNAB.*?(?:import|sync|update).*?(\d+)/i,
        ynabSuccess: /Successfully.*?YNAB.*?(\d+)/i,
        
        // PocketSmith specific patterns
        pocketsmithFetch: /PocketSmith.*?(?:fetch|retrieve).*?(\d+)/i,
        pocketsmithSuccess: /Successfully.*?PocketSmith.*?(\d+)/i,
      };

      let level = 'INFO';
      let transactionCount: number | undefined;
      let errorDetails: string | undefined;
      let duration: number | undefined;
      let requestId: string | undefined;

      // Extract request ID
      const requestMatch = message.match(patterns.requestStart) || message.match(patterns.requestEnd) || message.match(patterns.requestReport);
      if (requestMatch) {
        requestId = requestMatch[1];
      }

      // Extract duration from REPORT lines
      const reportMatch = message.match(patterns.requestReport);
      if (reportMatch) {
        duration = parseFloat(reportMatch[2]);
      }

      // Extract transaction counts - check all patterns
      const fetchedMatch = message.match(patterns.transactionsFetched);
      if (fetchedMatch) {
        transactionCount = parseInt(fetchedMatch[1], 10);
      }

      const processedMatch = message.match(patterns.transactionsProcessed);
      if (processedMatch) {
        transactionCount = parseInt(processedMatch[1], 10);
      }

      // Check additional patterns
      const countMatch = message.match(patterns.transactionCount);
      if (countMatch && !transactionCount) {
        transactionCount = parseInt(countMatch[1], 10);
      }

      const successMatch = message.match(patterns.successfulSync);
      if (successMatch && !transactionCount) {
        transactionCount = parseInt(successMatch[1], 10);
      }

      // Check YNAB specific patterns
      const ynabMatch = message.match(patterns.ynabImport) || message.match(patterns.ynabSuccess);
      if (ynabMatch && !transactionCount) {
        transactionCount = parseInt(ynabMatch[1], 10);
      }

      // Check PocketSmith specific patterns
      const pocketsmithMatch = message.match(patterns.pocketsmithFetch) || message.match(patterns.pocketsmithSuccess);
      if (pocketsmithMatch && !transactionCount) {
        transactionCount = parseInt(pocketsmithMatch[1], 10);
      }

      // Check for errors
      const errorMatch = message.match(patterns.error) || message.match(patterns.exception);
      if (errorMatch) {
        level = 'ERROR';
        errorDetails = errorMatch[2]?.trim();
      }

      // Check for specific log levels
      if (message.includes('ERROR') || message.includes('Error')) {
        level = 'ERROR';
      } else if (message.includes('WARN') || message.includes('Warning')) {
        level = 'WARN';
      } else if (message.includes('DEBUG')) {
        level = 'DEBUG';
      }

      return {
        timestamp,
        level,
        message: message.trim(),
        requestId,
        transactionCount,
        errorDetails,
        duration,
      };
    } catch (error) {
      console.warn('Failed to parse log message:', error);
      return {
        timestamp,
        level: 'INFO',
        message: message.trim(),
      };
    }
  }

  /**
   * Get recent log events from a specific log group
   */
  async getRecentLogEvents(
    logGroupName: string,
    startTime?: Date,
    endTime?: Date,
    limit: number = 100
  ): Promise<LogEvent[]> {
    try {
      const command = new FilterLogEventsCommand({
        logGroupName,
        startTime: startTime?.getTime(),
        endTime: endTime?.getTime(),
        limit,
      });

      const response = await this.client.send(command);
      
      return (response.events || []).map(event => ({
        timestamp: event.timestamp || 0,
        message: event.message || '',
        ingestionTime: event.ingestionTime || 0,
        eventId: `${event.timestamp}-${Math.random()}`, // Generate ID since eventId may not be available
      }));
    } catch (error: any) {
      console.error(`Failed to get log events from ${logGroupName}:`, error);
      if (error.name === 'ResourceNotFoundException') {
        console.warn(`Log group ${logGroupName} not found`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Discover all sync-related log groups dynamically
   */
  async discoverSyncLogGroups(): Promise<string[]> {
    try {
      const command = new DescribeLogGroupsCommand({
        limit: 50, // Reasonable limit to avoid too many results
      });

      const response = await this.client.send(command);
      const allLogGroups = response.logGroups || [];

      // Filter for sync-related log groups
      const syncLogGroups = allLogGroups
        .filter(group => {
          const name = group.logGroupName || '';
          return (
            name.includes('pocketsmith') ||
            name.includes('transaction') ||
            name.includes('sync') ||
            name.includes('ynab') ||
            // Include the existing known groups
            Object.values(EXISTING_LOG_GROUPS).includes(name as any)
          );
        })
        .map(group => group.logGroupName!)
        .filter(Boolean);

      console.log('Discovered sync-related log groups:', syncLogGroups);
      return syncLogGroups;
    } catch (error) {
      console.error('Failed to discover log groups:', error);
      // Fallback to known log groups
      return Object.values(EXISTING_LOG_GROUPS);
    }
  }

  /**
   * Get sync history from CloudWatch logs with improved discovery
   */
  async getSyncHistory(
    hours: number = 24,
    limit: number = 50
  ): Promise<SyncHistoryEntry[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

    const history: SyncHistoryEntry[] = [];

    // Discover all relevant log groups dynamically
    const logGroups = await this.discoverSyncLogGroups();
    console.log(`Searching ${logGroups.length} log groups for sync history`);

    // Get logs from all discovered sync-related functions
    for (const logGroupName of logGroups) {
      try {
        console.log(`Fetching events from log group: ${logGroupName}`);
        const events = await this.getRecentLogEvents(logGroupName, startTime, endTime, Math.min(limit * 2, 200));
        
        console.log(`Found ${events.length} events in ${logGroupName}`);

        // Group events by request ID to create sync entries
        const requestGroups = new Map<string, LogEvent[]>();
        
        for (const event of events) {
          const parsed = this.parseLogMessage(event.message, new Date(event.timestamp).toISOString());
          if (parsed?.requestId) {
            if (!requestGroups.has(parsed.requestId)) {
              requestGroups.set(parsed.requestId, []);
            }
            requestGroups.get(parsed.requestId)!.push(event);
          } else {
            // Also look for events that might indicate sync activity without explicit request IDs
            if (this.isSyncRelatedEvent(event.message)) {
              // Create a synthetic request ID based on timestamp and content
              const syntheticId = `sync-${Math.floor(event.timestamp / 60000)}-${logGroupName.split('/').pop()}`;
              if (!requestGroups.has(syntheticId)) {
                requestGroups.set(syntheticId, []);
              }
              requestGroups.get(syntheticId)!.push(event);
            }
          }
        }

        console.log(`Found ${requestGroups.size} request groups in ${logGroupName}`);

        // Convert request groups to sync history entries
        for (const [requestId, requestEvents] of requestGroups) {
          const entry = this.createSyncHistoryEntry(requestId, requestEvents, logGroupName);
          if (entry) {
            history.push(entry);
          }
        }
      } catch (error) {
        console.error(`Failed to get sync history from ${logGroupName}:`, error);
      }
    }

    console.log(`Total sync history entries found: ${history.length}`);

    // Sort by timestamp (most recent first) and limit results
    return history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Check if an event is sync-related even without explicit request ID
   */
  private isSyncRelatedEvent(message: string): boolean {
    const syncKeywords = [
      'transaction',
      'sync',
      'fetch',
      'process',
      'pocketsmith',
      'ynab',
      'import',
      'duplicate',
      'balance',
      'account'
    ];

    const lowerMessage = message.toLowerCase();
    return syncKeywords.some(keyword => lowerMessage.includes(keyword)) &&
           (lowerMessage.includes('completed') || 
            lowerMessage.includes('processed') || 
            lowerMessage.includes('fetched') ||
            lowerMessage.includes('imported') ||
            lowerMessage.includes('success') ||
            lowerMessage.includes('failed') ||
            lowerMessage.includes('error'));
  }

  /**
   * Create a sync history entry from log events
   */
  private createSyncHistoryEntry(
    requestId: string,
    events: LogEvent[],
    logGroupName: string
  ): SyncHistoryEntry | null {
    if (events.length === 0) return null;

    // Sort events by timestamp
    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];

    let status: 'success' | 'failed' | 'partial' = 'success';
    let transactionsFetched = 0;
    let transactionsProcessed = 0;
    let transactionsFailed = 0;
    let duplicatesSkipped = 0;
    let duration = 0;
    const errorDetails: string[] = [];

    // Parse all events to extract metrics
    for (const event of sortedEvents) {
      const parsed = this.parseLogMessage(event.message, new Date(event.timestamp).toISOString());
      if (!parsed) continue;

      // Extract transaction counts with improved logic
      if (parsed.transactionCount) {
        const message = parsed.message.toLowerCase();
        if (message.includes('fetched') || message.includes('retrieved') || message.includes('found')) {
          transactionsFetched = Math.max(transactionsFetched, parsed.transactionCount);
        } else if (message.includes('processed') || message.includes('imported') || message.includes('synced')) {
          transactionsProcessed = Math.max(transactionsProcessed, parsed.transactionCount);
        } else if (message.includes('failed') || message.includes('error')) {
          transactionsFailed += parsed.transactionCount;
        } else if (message.includes('skipped') || message.includes('duplicate')) {
          duplicatesSkipped += parsed.transactionCount;
        } else {
          // If we can't categorize, assume it's processed transactions
          transactionsProcessed = Math.max(transactionsProcessed, parsed.transactionCount);
        }
      }

      // Extract duration
      if (parsed.duration) {
        duration = Math.max(duration, parsed.duration);
      }

      // Collect errors
      if (parsed.level === 'ERROR' && parsed.errorDetails) {
        errorDetails.push(parsed.errorDetails);
        status = 'failed';
      }
    }

    // If we don't have explicit transaction counts, try to infer from the presence of sync-related events
    if (transactionsFetched === 0 && transactionsProcessed === 0 && transactionsFailed === 0) {
      // Look for any indication of sync activity
      const hasSyncActivity = sortedEvents.some(event => 
        this.isSyncRelatedEvent(event.message)
      );
      
      if (hasSyncActivity) {
        // Assume at least some activity happened, even if we can't quantify it
        transactionsProcessed = 1; // Placeholder to indicate activity
      }
    }

    // Determine final status
    if (errorDetails.length > 0) {
      status = 'failed';
    } else if (transactionsFailed > 0) {
      status = 'partial';
    } else if (transactionsProcessed > 0 || transactionsFetched > 0) {
      status = 'success';
    }

    // Calculate duration if not found in logs
    if (duration === 0) {
      duration = lastEvent.timestamp - firstEvent.timestamp;
    }

    // Only create entry if we have meaningful data
    if (transactionsFetched === 0 && transactionsProcessed === 0 && transactionsFailed === 0 && errorDetails.length === 0) {
      return null;
    }

    return {
      timestamp: new Date(firstEvent.timestamp).toISOString(), // Ensure ISO format for proper timezone handling
      requestId,
      status,
      transactionsFetched,
      transactionsProcessed,
      transactionsFailed,
      duplicatesSkipped,
      duration,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      logGroupName,
      logStreamName: 'aggregated', // We're aggregating across streams
    };
  }

  /**
   * Get current sync status from recent logs
   */
  async getCurrentSyncStatus(): Promise<{
    status: 'idle' | 'running' | 'completed' | 'failed';
    lastSyncTime?: string;
    transactionsProcessed: number;
    transactionsFailed: number;
    duplicatesSkipped: number;
    errorMessage?: string;
  }> {
    // Look at logs from the last hour to determine current status
    const recentHistory = await this.getSyncHistory(1, 10);
    
    if (recentHistory.length === 0) {
      return {
        status: 'idle',
        transactionsProcessed: 0,
        transactionsFailed: 0,
        duplicatesSkipped: 0,
      };
    }

    const latestEntry = recentHistory[0];
    
    // Check if there's an active sync (recent START without corresponding END)
    const now = new Date();
    const latestTime = new Date(latestEntry.timestamp);
    const timeDiff = now.getTime() - latestTime.getTime();
    
    // If the latest entry is less than 5 minutes old and has no duration, consider it running
    const isRunning = timeDiff < 5 * 60 * 1000 && latestEntry.duration === 0;
    
    return {
      status: isRunning ? 'running' : latestEntry.status === 'failed' ? 'failed' : 'completed',
      lastSyncTime: latestEntry.timestamp,
      transactionsProcessed: latestEntry.transactionsProcessed,
      transactionsFailed: latestEntry.transactionsFailed,
      duplicatesSkipped: latestEntry.duplicatesSkipped,
      errorMessage: latestEntry.errorDetails?.[0],
    };
  }

  /**
   * Stream real-time log events (for active sync operations)
   */
  async streamLogEvents(
    logGroupName: string,
    startTime: Date,
    callback: (event: LogEvent) => void
  ): Promise<void> {
    try {
      // Get the most recent log stream
      const streamsCommand = new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 1,
      });

      const streamsResponse = await this.client.send(streamsCommand);
      const latestStream = streamsResponse.logStreams?.[0];

      if (!latestStream?.logStreamName) {
        console.warn(`No log streams found in ${logGroupName}`);
        return;
      }

      // Get events from the latest stream
      const eventsCommand = new GetLogEventsCommand({
        logGroupName,
        logStreamName: latestStream.logStreamName,
        startTime: startTime.getTime(),
        startFromHead: false,
      });

      const eventsResponse = await this.client.send(eventsCommand);
      
      for (const event of eventsResponse.events || []) {
        callback({
          timestamp: event.timestamp || 0,
          message: event.message || '',
          ingestionTime: event.ingestionTime || 0,
          eventId: `${event.timestamp}-${Math.random()}`, // Generate ID since eventId may not be available
        });
      }
    } catch (error: any) {
      console.error(`Failed to stream log events from ${logGroupName}:`, error);
      throw error;
    }
  }

  /**
   * Check if log groups exist
   */
  async checkLogGroupsExist(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [key, logGroupName] of Object.entries(EXISTING_LOG_GROUPS)) {
      try {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });

        const response = await this.client.send(command);
        const exists = response.logGroups?.some(group => group.logGroupName === logGroupName) || false;
        results[key] = exists;
      } catch (error) {
        console.error(`Failed to check log group ${logGroupName}:`, error);
        results[key] = false;
      }
    }

    return results;
  }
}