import { SSMClient, GetParameterCommand, PutParameterCommand, ParameterType } from '@aws-sdk/client-ssm';
import { ExistingAccountMappingConfig, ParameterStoreCredentials, ValidationResult, ParameterStoreService } from './types';

export class ParameterStoreServiceImpl implements ParameterStoreService {
  private ssmClient: SSMClient;
  private readonly parameterPrefix = '/pocketsmith-ynab-sync';

  constructor() {
    this.ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }

  async getAccountMapping(): Promise<ExistingAccountMappingConfig> {
    try {
      const command = new GetParameterCommand({
        Name: `${this.parameterPrefix}/account-mapping`,
        WithDecryption: true
      });

      const response = await this.ssmClient.send(command);
      
      if (!response.Parameter?.Value) {
        // Return default configuration if parameter doesn't exist
        return {
          mappings: {},
          strict_mode: false,
          created_at: new Date().toISOString(),
          auto_generated: true
        };
      }

      return JSON.parse(response.Parameter.Value) as ExistingAccountMappingConfig;
    } catch (error) {
      console.error('Error getting account mapping from Parameter Store:', error);
      
      // If parameter doesn't exist, return default configuration
      if ((error as any).name === 'ParameterNotFound') {
        return {
          mappings: {},
          strict_mode: false,
          created_at: new Date().toISOString(),
          auto_generated: true
        };
      }
      
      throw error;
    }
  }

  async updateAccountMapping(config: ExistingAccountMappingConfig): Promise<void> {
    try {
      // Add timestamp for updates
      const updatedConfig = {
        ...config,
        updated_at: new Date().toISOString()
      };

      const command = new PutParameterCommand({
        Name: `${this.parameterPrefix}/account-mapping`,
        Value: JSON.stringify(updatedConfig),
        Type: ParameterType.STRING,
        Overwrite: true,
        Description: 'Account mapping configuration for PocketSmith-YNAB sync'
      });

      await this.ssmClient.send(command);
      console.log('Successfully updated account mapping in Parameter Store');
    } catch (error) {
      console.error('Error updating account mapping in Parameter Store:', error);
      throw error;
    }
  }

  async getCredentials(): Promise<ParameterStoreCredentials> {
    try {
      const [pocketsmithResponse, ynabResponse, budgetResponse] = await Promise.all([
        this.ssmClient.send(new GetParameterCommand({
          Name: `${this.parameterPrefix}/pocketsmith-api-key`,
          WithDecryption: true
        })),
        this.ssmClient.send(new GetParameterCommand({
          Name: `${this.parameterPrefix}/ynab-api-key`,
          WithDecryption: true
        })),
        this.ssmClient.send(new GetParameterCommand({
          Name: `${this.parameterPrefix}/ynab-budget-id`,
          WithDecryption: true
        }))
      ]);

      if (!pocketsmithResponse.Parameter?.Value || 
          !ynabResponse.Parameter?.Value || 
          !budgetResponse.Parameter?.Value) {
        throw new Error('Missing required API credentials in Parameter Store');
      }

      return {
        pocketsmithApiKey: pocketsmithResponse.Parameter.Value,
        ynabApiKey: ynabResponse.Parameter.Value,
        ynabBudgetId: budgetResponse.Parameter.Value
      };
    } catch (error) {
      console.error('Error getting credentials from Parameter Store:', error);
      throw error;
    }
  }

  async validateCredentials(): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      const credentials = await this.getCredentials();

      // Basic validation - check if credentials exist and are not empty
      if (!credentials.pocketsmithApiKey || credentials.pocketsmithApiKey.trim() === '') {
        errors.push('PocketSmith API key is missing or empty');
      }

      if (!credentials.ynabApiKey || credentials.ynabApiKey.trim() === '') {
        errors.push('YNAB API key is missing or empty');
      }

      if (!credentials.ynabBudgetId || credentials.ynabBudgetId.trim() === '') {
        errors.push('YNAB Budget ID is missing or empty');
      }

      // Additional validation - check format
      if (credentials.pocketsmithApiKey && !credentials.pocketsmithApiKey.match(/^[a-zA-Z0-9_-]+$/)) {
        errors.push('PocketSmith API key format appears invalid');
      }

      if (credentials.ynabApiKey && !credentials.ynabApiKey.match(/^[a-zA-Z0-9_-]+$/)) {
        errors.push('YNAB API key format appears invalid');
      }

      if (credentials.ynabBudgetId && !credentials.ynabBudgetId.match(/^[a-fA-F0-9-]+$/)) {
        errors.push('YNAB Budget ID format appears invalid (should be UUID format)');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Failed to retrieve credentials: ${(error as Error).message}`);
      return {
        isValid: false,
        errors
      };
    }
  }
}