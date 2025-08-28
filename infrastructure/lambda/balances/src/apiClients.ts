import axios, { AxiosInstance, type AxiosResponse } from 'axios';
import { PocketSmithAccount, YNABAccount, YNABAccountsResponse } from './types';

export class PocketSmithClient {
  private client: AxiosInstance;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private userId: number | null = null;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.pocketsmith.com/v2',
      headers: {
        'X-Developer-Key': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.client.interceptors.response.use(
      (response) => {
        console.log(`PocketSmith API call successful: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`PocketSmith API call failed: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    attempt: number = 1
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      if (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        (error.response?.status >= 500)
      ) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`PocketSmith API retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
        await this.sleep(delay);
        return this.retryRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  private async getUserId(): Promise<number> {
    if (this.userId !== null) {
      return this.userId;
    }

    try {
      console.log('Fetching PocketSmith user information...');
      const response = await this.retryRequest(() =>
        this.client.get<{ id: number }>('/me')
      );

      this.userId = response.data.id;
      console.log(`PocketSmith user ID: ${this.userId}`);
      return this.userId;
    } catch (error: any) {
      console.error('Error fetching PocketSmith user information:', error);

      if (error.response?.status === 401) {
        throw new Error('Invalid PocketSmith API key. Please check your credentials.');
      } else if (error.response?.status === 403) {
        throw new Error('PocketSmith API access forbidden. Please check your API key permissions.');
      }

      throw new Error(`Failed to fetch PocketSmith user information: ${error.message}`);
    }
  }

  async getAccounts(): Promise<PocketSmithAccount[]> {
    try {
      console.log('Fetching PocketSmith accounts for balance comparison...');

      // Get user ID first
      const userId = await this.getUserId();

      const response = await this.retryRequest(() =>
        this.client.get<PocketSmithAccount[]>(`/users/${userId}/accounts`)
      );

      console.log(`Successfully fetched ${response.data.length} PocketSmith accounts`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching PocketSmith accounts:', error);

      if (error.response?.status === 401) {
        throw new Error('Invalid PocketSmith API key. Please check your credentials.');
      } else if (error.response?.status === 403) {
        throw new Error('PocketSmith API access forbidden. Please check your API key permissions.');
      } else if (error.response?.status === 429) {
        throw new Error('PocketSmith API rate limit exceeded. Please try again later.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('PocketSmith API request timed out. Please try again.');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to PocketSmith API. Please check your internet connection.');
      }

      throw new Error(`Failed to fetch PocketSmith accounts: ${error.message}`);
    }
  }
}

export class YNABClient {
  private client: AxiosInstance;
  private budgetId: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(apiKey: string, budgetId: string) {
    this.budgetId = budgetId;
    this.client = axios.create({
      baseURL: 'https://api.ynab.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.client.interceptors.response.use(
      (response) => {
        console.log(`YNAB API call successful: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`YNAB API call failed: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    attempt: number = 1
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      if (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        (error.response?.status >= 500)
      ) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`YNAB API retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
        await this.sleep(delay);
        return this.retryRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  async getAccounts(): Promise<YNABAccount[]> {
    try {
      console.log(`Fetching YNAB accounts for budget ${this.budgetId} for balance comparison...`);

      const response = await this.retryRequest(() =>
        this.client.get<YNABAccountsResponse>(`/budgets/${this.budgetId}/accounts`)
      );

      const accounts = response.data.data.accounts;
      console.log(`Successfully fetched ${accounts.length} YNAB accounts`);
      return accounts;
    } catch (error: any) {
      console.error('Error fetching YNAB accounts:', error);

      if (error.response?.status === 401) {
        throw new Error('Invalid YNAB API key. Please check your credentials.');
      } else if (error.response?.status === 403) {
        throw new Error('YNAB API access forbidden. Please check your API key permissions.');
      } else if (error.response?.status === 404) {
        throw new Error(`YNAB budget not found: ${this.budgetId}. Please check your budget ID.`);
      } else if (error.response?.status === 429) {
        throw new Error('YNAB API rate limit exceeded. Please try again later.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('YNAB API request timed out. Please try again.');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to YNAB API. Please check your internet connection.');
      }

      throw new Error(`Failed to fetch YNAB accounts: ${error.message}`);
    }
  }
}