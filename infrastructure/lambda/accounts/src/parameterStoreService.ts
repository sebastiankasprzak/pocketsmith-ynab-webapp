import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';

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

  async updateYNABBudgetId(budgetId: string): Promise<void> {
    try {
      const command = new PutParameterCommand({
        Name: '/pocketsmith-ynab-sync/ynab-budget-id',
        Value: budgetId,
        Type: 'String',
        Overwrite: true,
        Description: 'YNAB Budget ID for PocketSmith-YNAB sync'
      });

      await this.ssm.send(command);
      console.log(`Successfully updated YNAB budget ID to: ${budgetId}`);
    } catch (error) {
      console.error('Error updating YNAB budget ID:', error);
      throw new Error(`Failed to update YNAB budget ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}