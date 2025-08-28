import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

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
    account_name?: string;
    last_sync: string | null;
    processed_transactions_count: number;
    last_updated: string;
  }>;
  total_accounts: number;
  total_processed_transactions: number;
  last_activity: string | null;
}

interface PocketSmithAccount {
  id: number;
  title: string;
  name?: string;
  type: string;
  currency_code: string;
}

export class DynamoDbSyncStateService {
  private client: DynamoDBDocumentClient;
  private tableName: string;
  private ssmClient: SSMClient;
  private accountNamesCache: Map<string, string> = new Map();
  private cacheExpiry: number = 0;

  constructor() {
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.tableName = process.env.SYNC_STATE_TABLE_NAME || 'dev-pocketsmith-ynab-sync-state';
  }

  /**
   * Get PocketSmith API key from Parameter Store
   */
  private async getPocketSmithApiKey(): Promise<string> {
    try {
      const command = new GetParameterCommand({
        Name: '/pocketsmith-ynab-sync/pocketsmith-api-key',
        WithDecryption: true,
      });
      
      const response = await this.ssmClient.send(command);
      return response.Parameter?.Value || '';
    } catch (error) {
      console.error('Error fetching PocketSmith API key:', error);
      throw new Error('Failed to fetch PocketSmith API key');
    }
  }

  /**
   * Fetch PocketSmith accounts and cache account names
   */
  private async fetchAccountNames(): Promise<void> {
    // Check if cache is still valid (5 minutes)
    if (Date.now() < this.cacheExpiry) {
      console.log('Account names cache is still valid, skipping fetch');
      return;
    }

    console.log('Fetching account names from PocketSmith API...');
    
    try {
      const apiKey = await this.getPocketSmithApiKey();
      console.log('Successfully retrieved PocketSmith API key from Parameter Store');
      
      // First get user ID
      console.log('Fetching user info from PocketSmith API...');
      const userResponse = await fetch('https://api.pocketsmith.com/v2/me', {
        headers: {
          'X-Developer-Key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error(`Failed to fetch user info: ${userResponse.status} - ${errorText}`);
        throw new Error(`Failed to fetch user info: ${userResponse.status}`);
      }

      const userData = await userResponse.json() as { id: number };
      const userId = userData.id;
      console.log(`Successfully fetched user info, user ID: ${userId}`);

      // Then fetch accounts
      console.log('Fetching accounts from PocketSmith API...');
      const accountsResponse = await fetch(`https://api.pocketsmith.com/v2/users/${userId}/accounts`, {
        headers: {
          'X-Developer-Key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!accountsResponse.ok) {
        const errorText = await accountsResponse.text();
        console.error(`Failed to fetch accounts: ${accountsResponse.status} - ${errorText}`);
        throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
      }

      const accounts = await accountsResponse.json() as PocketSmithAccount[];
      console.log(`Successfully fetched ${accounts.length} accounts from PocketSmith API`);
      
      // Clear and rebuild cache
      this.accountNamesCache.clear();
      
      accounts.forEach(account => {
        const accountName = account.title || account.name || `PocketSmith ${account.type || 'Account'} (${account.id})`;
        this.accountNamesCache.set(account.id.toString(), accountName);
        console.log(`Cached account ${account.id}: "${accountName}"`);
      });

      // Set cache expiry to 5 minutes from now
      this.cacheExpiry = Date.now() + (5 * 60 * 1000);
      
      console.log(`Successfully cached ${accounts.length} account names, cache expires at ${new Date(this.cacheExpiry).toISOString()}`);
    } catch (error) {
      console.error('Error fetching account names:', error);
      // Don't throw - we can still return data without names
    }
  }

  /**
   * Get account name from cache
   */
  private getAccountName(accountId: string): string | undefined {
    return this.accountNamesCache.get(accountId);
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
    console.log('Starting getSyncStateOverview...');
    
    // Fetch account names first
    console.log('Fetching account names...');
    await this.fetchAccountNames();

    const [processedTransactions, lastSyncs] = await Promise.all([
      this.getProcessedTransactionsState(),
      this.getLastSyncState(),
    ]);

    // Create a map of account data
    const accountMap = new Map<string, {
      account_id: string;
      account_name?: string;
      last_sync: string | null;
      processed_transactions_count: number;
      last_updated: string;
    }>();

    // Process last sync data
    lastSyncs.forEach(sync => {
      const accountName = this.getAccountName(sync.account_id);
      console.log(`Processing last sync for account ${sync.account_id}, resolved name: "${accountName}"`);
      accountMap.set(sync.account_id, {
        account_id: sync.account_id,
        account_name: accountName,
        last_sync: sync.timestamp,
        processed_transactions_count: 0,
        last_updated: sync.updated_at,
      });
    });

    // Process transaction data
    processedTransactions.forEach(transactions => {
      const existing = accountMap.get(transactions.account_id);
      const accountName = this.getAccountName(transactions.account_id);
      console.log(`Processing transactions for account ${transactions.account_id}, resolved name: "${accountName}"`);
      
      if (existing) {
        existing.processed_transactions_count = transactions.transaction_count;
        if (!existing.account_name && accountName) {
          existing.account_name = accountName;
        }
        // Use the most recent update time
        if (transactions.updated_at > existing.last_updated) {
          existing.last_updated = transactions.updated_at;
        }
      } else {
        accountMap.set(transactions.account_id, {
          account_id: transactions.account_id,
          account_name: accountName,
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
      accounts: accounts.sort((a, b) => {
        // Sort by account name if available, otherwise by account ID
        const aName = a.account_name || a.account_id;
        const bName = b.account_name || b.account_id;
        return aName.localeCompare(bName);
      }),
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
    account_name?: string;
    recent_transactions: Array<{
      transaction_id: string;
      processed_at: string;
    }>;
    count: number;
  }>> {
    // Fetch account names first
    await this.fetchAccountNames();

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
        account_name: this.getAccountName(account.account_id),
        recent_transactions: recentTransactions,
        count: recentTransactions.length,
      };
    }).filter(account => account.count > 0);
  }
}