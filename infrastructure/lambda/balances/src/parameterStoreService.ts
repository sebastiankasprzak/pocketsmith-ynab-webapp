import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { ExistingAccountMappingConfig } from './types';

export class ParameterStoreService {
  private ssm: SSMClient;

  constructor() {
    this.ssm = new SSMClient({});
  }

  async getParameter(name: string, withDecryption: boolean = true): Promise<string> {
    try {
      const command = new GetParameterCommand({
        Name: name,
        WithDecryption: withDecryption
      });

      const result = await this.ssm.send(command);

      if (!result.Parameter?.Value) {
        throw new Error(`Parameter ${name} not found or has no value`);
      }

      return result.Parameter.Value;
    } catch (error) {
      console.error(`Error fetching parameter ${name}:`, error);
      throw new Error(`Failed to fetch parameter ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPocketSmithApiKey(): Promise<string> {
    return this.getParameter('/pocketsmith-ynab-sync/pocketsmith-api-key');
  }

  async getYNABApiKey(): Promise<string> {
    return this.getParameter('/pocketsmith-ynab-sync/ynab-api-key');
  }

  async getYNABBudgetId(): Promise<string> {
    return this.getParameter('/pocketsmith-ynab-sync/ynab-budget-id');
  }

  async getAccountMappings(): Promise<ExistingAccountMappingConfig> {
    try {
      const mappingJson = await this.getParameter('/pocketsmith-ynab-sync/account-mapping');
      return JSON.parse(mappingJson);
    } catch (error) {
      console.error('Error fetching account mappings:', error);
      // Return empty mappings if not found
      return {
        mappings: {},
        strict_mode: false
      };
    }
  }
}