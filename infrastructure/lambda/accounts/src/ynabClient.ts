import axios, { AxiosInstance, type AxiosResponse } from 'axios';
import { YNABAccount, YNABAccountsResponse, YNABBudget, YNABBudgetsResponse } from './types';

export class YNABClient {
  private client: AxiosInstance;
  private budgetId: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second base delay

  constructor(apiKey: string, budgetId: string) {
    this.budgetId = budgetId;
    this.client = axios.create({
      baseURL: 'https://api.ynab.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Add response interceptor for logging
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

      // Retry on network errors or 5xx server errors
      if (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        (error.response?.status >= 500)
      ) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`YNAB API retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
        await this.sleep(delay);
        return this.retryRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  async getAccounts(): Promise<YNABAccount[]> {
    try {
      console.log(`Fetching YNAB accounts for budget ${this.budgetId}...`);
      
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

  async validateApiKey(): Promise<boolean> {
    try {
      console.log('Validating YNAB API key...');
      
      // Try to fetch user info as a lightweight validation
      await this.retryRequest(() => 
        this.client.get('/user')
      );
      
      console.log('YNAB API key validation successful');
      return true;
    } catch (error: any) {
      console.error('YNAB API key validation failed:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }
      
      // For other errors, we can't determine if the key is valid
      throw new Error(`Unable to validate YNAB API key: ${error.message}`);
    }
  }

  async getBudgets(): Promise<YNABBudget[]> {
    try {
      console.log('Fetching YNAB budgets...');
      
      const response = await this.retryRequest(() => 
        this.client.get<YNABBudgetsResponse>('/budgets')
      );

      const budgets = response.data.data.budgets;
      console.log(`Successfully fetched ${budgets.length} YNAB budgets`);
      return budgets;
    } catch (error: any) {
      console.error('Error fetching YNAB budgets:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid YNAB API key. Please check your credentials.');
      } else if (error.response?.status === 403) {
        throw new Error('YNAB API access forbidden. Please check your API key permissions.');
      } else if (error.response?.status === 429) {
        throw new Error('YNAB API rate limit exceeded. Please try again later.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('YNAB API request timed out. Please try again.');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to YNAB API. Please check your internet connection.');
      }
      
      throw new Error(`Failed to fetch YNAB budgets: ${error.message}`);
    }
  }

  async validateBudgetAccess(): Promise<boolean> {
    try {
      console.log(`Validating YNAB budget access for ${this.budgetId}...`);
      
      // Try to fetch budget info as validation
      await this.retryRequest(() => 
        this.client.get(`/budgets/${this.budgetId}`)
      );
      
      console.log('YNAB budget access validation successful');
      return true;
    } catch (error: any) {
      console.error('YNAB budget access validation failed:', error);
      
      if (error.response?.status === 404) {
        return false;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }
      
      // For other errors, we can't determine if the budget is accessible
      throw new Error(`Unable to validate YNAB budget access: ${error.message}`);
    }
  }
}