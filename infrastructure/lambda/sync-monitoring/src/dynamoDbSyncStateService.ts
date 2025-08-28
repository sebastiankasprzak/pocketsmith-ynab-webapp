import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export interface DynamoDbSyncStateItem {
  sync_type: string;
  account_id: string;
  updated_at: string;
  timestamp?: string;
  transaction_count?: number;
  transactions?: Record<string, string>;
}

export interface ProcessedTransactionsState {
  account_id: string;
  transaction_count: number;
  transactions: Record<string, string>;
  updated_at: string;
}

export interface LastSyncState {
  account_id: string;
  timestamp: string;
  updated_at: string;
}

export interface SyncStateOverview {
  accounts: Array<{
    account_id: string;
    last_sync: string | null;
    processed_transactions_count: number;
    last_updated: string;
  }>;
  total_accounts: number;
  total_processed_transactions: number;
  last_activity: string | null;
}

export class DynamoDbSyncStateService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.SYNC_STATE_TABLE_NAME || 'dev-pocketsmith-ynab-sync-state';
  }

  /**
   * Get all sync state data from DynamoDB
   */
  async getAllSyncState(): Promise<DynamoDbSyncStateItem[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
      });

      const response = await this.client.send(command);
      return response.Items as DynamoDbSyncStateItem[] || [];
    } catch (error) {
      console.error('Error scanning DynamoDB sync state table:', error);
      throw new Error(`Failed to fetch sync state data: ${error}`);
    }
  }

  /**
   * Get sync state for a specific account
   */
  async getAccountSyncState(accountId: string): Promise<DynamoDbSyncStateItem[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'account_id = :accountId',
        ExpressionAttributeValues: {
          ':accountId': accountId,
        },
      });

      const response = await this.client.send(command);
      return response.Items as DynamoDbSyncStateItem[] || [];
    } catch (error) {
      console.error(`Error querying sync state for account ${accountId}:`, error);
      throw new Error(`Failed to fetch sync state for account ${accountId}: ${error}`);
    }
  }

  /**
   * Get processed transactions state for all accounts
   */
  async getProcessedTransactionsState(): Promise<ProcessedTransactionsState[]> {
    const allItems = await this.getAllSyncState();
    
    return allItems
      .filter(item => item.sync_type === 'processed_transactions')
      .map(item => ({
        account_id: item.account_id,
        transaction_count: item.transaction_count || 0,
        transactions: item.transactions || {},
        updated_at: item.updated_at,
      }));
  }

  /**
   * Get last sync timestamps for all accounts
   */
  async getLastSyncState(): Promise<LastSyncState[]> {
    const allItems = await this.getAllSyncState();
    
    return allItems
      .filter(item => item.sync_type === 'last_sync')
      .map(item => ({
        account_id: item.account_id,
        timestamp: item.timestamp || '',
        updated_at: item.updated_at,
      }));
  }

  /**
   * Get comprehensive sync state overview
   */
  async getSyncStateOverview(): Promise<SyncStateOverview> {
    const [processedTransactions, lastSyncs] = await Promise.all([
      this.getProcessedTransactionsState(),
      this.getLastSyncState(),
    ]);

    // Create a map of account data
    const accountMap = new Map<string, {
      account_id: string;
      last_sync: string | null;
      processed_transactions_count: number;
      last_updated: string;
    }>();

    // Process last sync data
    lastSyncs.forEach(sync => {
      accountMap.set(sync.account_id, {
        account_id: sync.account_id,
        last_sync: sync.timestamp,
        processed_transactions_count: 0,
        last_updated: sync.updated_at,
      });
    });

    // Process transaction data
    processedTransactions.forEach(transactions => {
      const existing = accountMap.get(transactions.account_id);
      if (existing) {
        existing.processed_transactions_count = transactions.transaction_count;
        // Use the most recent update time
        if (transactions.updated_at > existing.last_updated) {
          existing.last_updated = transactions.updated_at;
        }
      } else {
        accountMap.set(transactions.account_id, {
          account_id: transactions.account_id,
          last_sync: null,
          processed_transactions_count: transactions.transaction_count,
          last_updated: transactions.updated_at,
        });
      }
    });

    const accounts = Array.from(accountMap.values());
    
    // Calculate totals
    const totalProcessedTransactions = accounts.reduce(
      (sum, account) => sum + account.processed_transactions_count, 
      0
    );

    // Find most recent activity
    const lastActivity = accounts.length > 0 
      ? accounts.reduce((latest, account) => 
          !latest || account.last_updated > latest ? account.last_updated : latest, 
          null as string | null
        )
      : null;

    return {
      accounts: accounts.sort((a, b) => a.account_id.localeCompare(b.account_id)),
      total_accounts: accounts.length,
      total_processed_transactions: totalProcessedTransactions,
      last_activity: lastActivity,
    };
  }

  /**
   * Get recent transaction activity (transactions processed in the last N hours)
   */
  async getRecentTransactionActivity(hoursBack: number = 24): Promise<Array<{
    account_id: string;
    recent_transactions: Array<{
      transaction_id: string;
      processed_at: string;
    }>;
    count: number;
  }>> {
    const processedTransactions = await this.getProcessedTransactionsState();
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    return processedTransactions.map(account => {
      const recentTransactions = Object.entries(account.transactions || {})
        .filter(([_, processedAt]) => new Date(processedAt) > cutoffTime)
        .map(([transactionId, processedAt]) => ({
          transaction_id: transactionId,
          processed_at: processedAt,
        }))
        .sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime());

      return {
        account_id: account.account_id,
        recent_transactions: recentTransactions,
        count: recentTransactions.length,
      };
    }).filter(account => account.count > 0);
  }
}