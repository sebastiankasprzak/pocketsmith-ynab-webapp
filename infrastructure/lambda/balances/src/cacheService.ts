import { SSMClient, GetParameterCommand, PutParameterCommand, DeleteParameterCommand } from '@aws-sdk/client-ssm';
import { CachedBalanceData, PocketSmithAccount, YNABAccount } from './types';

export class CacheService {
  private ssm: SSMClient;
  private cacheKeyPrefix: string = '/pocketsmith-ynab-sync/cache';
  private defaultTTL: number = 300; // 5 minutes in seconds

  constructor() {
    this.ssm = new SSMClient({});
  }

  private getCacheKey(key: string): string {
    return `${this.cacheKeyPrefix}/${key}`;
  }

  private isExpired(timestamp: string, ttl: number): boolean {
    const cacheTime = new Date(timestamp).getTime();
    const now = Date.now();
    const expiryTime = cacheTime + (ttl * 1000);
    return now > expiryTime;
  }

  async getCachedBalanceData(): Promise<CachedBalanceData | null> {
    try {
      const cacheKey = this.getCacheKey('balance-data');
      console.log(`Checking cache for balance data: ${cacheKey}`);

      const command = new GetParameterCommand({
        Name: cacheKey,
        WithDecryption: false
      });
      const result = await this.ssm.send(command);

      if (!result.Parameter?.Value) {
        console.log('No cached balance data found');
        return null;
      }

      const cachedData: CachedBalanceData = JSON.parse(result.Parameter.Value);
      
      if (this.isExpired(cachedData.timestamp, cachedData.ttl)) {
        console.log('Cached balance data has expired');
        return null;
      }

      console.log(`Found valid cached balance data from ${cachedData.timestamp}`);
      return cachedData;
    } catch (error: any) {
      if (error.code === 'ParameterNotFound') {
        console.log('No cached balance data found');
        return null;
      }
      
      console.error('Error retrieving cached balance data:', error);
      return null; // Don't fail if cache retrieval fails
    }
  }

  async setCachedBalanceData(
    pocketsmithAccounts: PocketSmithAccount[],
    ynabAccounts: YNABAccount[],
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey('balance-data');
      const cachedData: CachedBalanceData = {
        pocketsmithAccounts,
        ynabAccounts,
        timestamp: new Date().toISOString(),
        ttl
      };

      console.log(`Caching balance data with TTL ${ttl} seconds`);

      const command = new PutParameterCommand({
        Name: cacheKey,
        Value: JSON.stringify(cachedData),
        Type: 'String',
        Overwrite: true,
        Description: 'Cached balance data for PocketSmith-YNAB comparison'
      });
      await this.ssm.send(command);

      console.log('Balance data cached successfully');
    } catch (error) {
      console.error('Error caching balance data:', error);
      // Don't fail if caching fails - just log the error
    }
  }

  async clearCache(): Promise<void> {
    try {
      const cacheKey = this.getCacheKey('balance-data');
      console.log(`Clearing cache: ${cacheKey}`);

      const command = new DeleteParameterCommand({
        Name: cacheKey
      });
      await this.ssm.send(command);

      console.log('Cache cleared successfully');
    } catch (error: any) {
      if (error.code === 'ParameterNotFound') {
        console.log('No cache to clear');
        return;
      }
      
      console.error('Error clearing cache:', error);
      // Don't fail if cache clearing fails
    }
  }

  async getCacheTTL(): Promise<number> {
    try {
      const ttlKey = this.getCacheKey('ttl-config');
      const command = new GetParameterCommand({
        Name: ttlKey,
        WithDecryption: false
      });
      const result = await this.ssm.send(command);

      if (result.Parameter?.Value) {
        const ttl = parseInt(result.Parameter.Value, 10);
        if (!isNaN(ttl) && ttl > 0) {
          return ttl;
        }
      }
    } catch (error) {
      console.log('Using default TTL, no custom TTL configured');
    }

    return this.defaultTTL;
  }

  async setCacheTTL(ttl: number): Promise<void> {
    try {
      const ttlKey = this.getCacheKey('ttl-config');
      
      const command = new PutParameterCommand({
        Name: ttlKey,
        Value: ttl.toString(),
        Type: 'String',
        Overwrite: true,
        Description: 'Cache TTL configuration for balance data (seconds)'
      });
      await this.ssm.send(command);

      console.log(`Cache TTL set to ${ttl} seconds`);
    } catch (error) {
      console.error('Error setting cache TTL:', error);
    }
  }
}