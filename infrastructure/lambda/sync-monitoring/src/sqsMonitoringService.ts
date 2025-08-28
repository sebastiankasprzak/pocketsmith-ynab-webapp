import {
  SQSClient,
  GetQueueAttributesCommand,
  ListQueuesCommand,
  ReceiveMessageCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import {
  QueueMetrics,
  DeadLetterQueueStatus,
  EXISTING_QUEUES,
} from './types';

export class SQSMonitoringService {
  private client: SQSClient;

  constructor(region: string = process.env.AWS_REGION || 'us-east-1') {
    this.client = new SQSClient({ region });
  }

  /**
   * Get queue URL by name
   */
  private async getQueueUrl(queueName: string): Promise<string | null> {
    try {
      const command = new GetQueueUrlCommand({
        QueueName: queueName,
      });

      const response = await this.client.send(command);
      return response.QueueUrl || null;
    } catch (error: any) {
      if (error.name === 'QueueDoesNotExist') {
        console.warn(`Queue ${queueName} does not exist`);
        return null;
      }
      console.error(`Failed to get queue URL for ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: string): Promise<QueueMetrics | null> {
    try {
      const queueUrl = await this.getQueueUrl(queueName);
      if (!queueUrl) {
        return null;
      }

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'], // Use 'All' to get all attributes
      });

      const response = await this.client.send(command);
      const attributes = response.Attributes || {};

      // Type-safe attribute access
      const getAttributeValue = (key: string): string | undefined => {
        return (attributes as Record<string, string>)[key];
      };

      return {
        queueUrl,
        queueName,
        approximateNumberOfMessages: parseInt(getAttributeValue('ApproximateNumberOfMessages') || '0', 10),
        approximateNumberOfMessagesNotVisible: parseInt(getAttributeValue('ApproximateNumberOfMessagesNotVisible') || '0', 10),
        approximateAgeOfOldestMessage: getAttributeValue('ApproximateAgeOfOldestMessage') 
          ? parseInt(getAttributeValue('ApproximateAgeOfOldestMessage')!, 10) 
          : undefined,
        lastModified: getAttributeValue('LastModifiedTimestamp') 
          ? new Date(parseInt(getAttributeValue('LastModifiedTimestamp')!, 10) * 1000).toISOString()
          : new Date().toISOString(),
      };
    } catch (error: any) {
      console.error(`Failed to get metrics for queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get all queue metrics for known queues
   */
  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];

    for (const queueName of Object.values(EXISTING_QUEUES)) {
      try {
        const queueMetrics = await this.getQueueMetrics(queueName);
        if (queueMetrics) {
          metrics.push(queueMetrics);
        }
      } catch (error) {
        console.error(`Failed to get metrics for queue ${queueName}:`, error);
        // Continue with other queues even if one fails
      }
    }

    return metrics;
  }

  /**
   * Check dead letter queue status
   */
  async getDeadLetterQueueStatus(): Promise<DeadLetterQueueStatus | null> {
    try {
      const dlqName = EXISTING_QUEUES.DEAD_LETTER;
      const queueUrl = await this.getQueueUrl(dlqName);
      
      if (!queueUrl) {
        return null;
      }

      // Get queue attributes
      const attributesCommand = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });

      const attributesResponse = await this.client.send(attributesCommand);
      const attributes = attributesResponse.Attributes || {};

      // Type-safe attribute access for DLQ
      const getAttributeValue = (key: string): string | undefined => {
        return (attributes as Record<string, string>)[key];
      };

      const messageCount = parseInt(getAttributeValue('ApproximateNumberOfMessages') || '0', 10);
      const hasMessages = messageCount > 0;

      let sampleMessages: Array<{
        messageId: string;
        body: string;
        timestamp: string;
        errorReason?: string;
      }> = [];

      // If there are messages, get a few samples
      if (hasMessages) {
        try {
          const receiveCommand = new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: Math.min(messageCount, 5), // Get up to 5 sample messages
            VisibilityTimeout: 1, // Short timeout so messages become visible again quickly
            AttributeNames: ['All'],
            MessageAttributeNames: ['All'],
          });

          const receiveResponse = await this.client.send(receiveCommand);
          
          sampleMessages = (receiveResponse.Messages || []).map(message => {
            let errorReason: string | undefined;
            
            // Try to extract error reason from message attributes or body
            if (message.MessageAttributes?.errorReason?.StringValue) {
              errorReason = message.MessageAttributes.errorReason.StringValue;
            } else if (message.Body) {
              try {
                const body = JSON.parse(message.Body);
                errorReason = body.errorReason || body.error || body.errorMessage;
              } catch {
                // If body is not JSON, look for error patterns
                const errorMatch = message.Body.match(/error[:\s]+([^,\n]+)/i);
                if (errorMatch) {
                  errorReason = errorMatch[1].trim();
                }
              }
            }

            return {
              messageId: message.MessageId || 'unknown',
              body: message.Body || '',
              timestamp: message.Attributes?.SentTimestamp 
                ? new Date(parseInt(message.Attributes.SentTimestamp, 10)).toISOString()
                : new Date().toISOString(),
              errorReason,
            };
          });
        } catch (error) {
          console.error('Failed to sample DLQ messages:', error);
          // Continue without sample messages
        }
      }

      return {
        hasMessages,
        messageCount,
        oldestMessageAge: getAttributeValue('ApproximateAgeOfOldestMessage') 
          ? parseInt(getAttributeValue('ApproximateAgeOfOldestMessage')!, 10)
          : undefined,
        sampleMessages,
      };
    } catch (error: any) {
      console.error('Failed to get dead letter queue status:', error);
      throw error;
    }
  }

  /**
   * Monitor queue depth changes over time
   */
  async monitorQueueDepth(queueName: string, intervalSeconds: number = 30, durationMinutes: number = 5): Promise<Array<{
    timestamp: string;
    depth: number;
    processing: number;
  }>> {
    const measurements: Array<{
      timestamp: string;
      depth: number;
      processing: number;
    }> = [];

    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    
    while (Date.now() < endTime) {
      try {
        const metrics = await this.getQueueMetrics(queueName);
        if (metrics) {
          measurements.push({
            timestamp: new Date().toISOString(),
            depth: metrics.approximateNumberOfMessages,
            processing: metrics.approximateNumberOfMessagesNotVisible,
          });
        }

        // Wait for the next interval
        await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
      } catch (error) {
        console.error(`Error monitoring queue ${queueName}:`, error);
        break;
      }
    }

    return measurements;
  }

  /**
   * Check if queues exist
   */
  async checkQueuesExist(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [key, queueName] of Object.entries(EXISTING_QUEUES)) {
      try {
        const queueUrl = await this.getQueueUrl(queueName);
        results[key] = queueUrl !== null;
      } catch (error) {
        console.error(`Failed to check queue ${queueName}:`, error);
        results[key] = false;
      }
    }

    return results;
  }

  /**
   * Get processing progress based on queue metrics
   */
  async getProcessingProgress(): Promise<{
    totalMessages: number;
    processingMessages: number;
    queuedMessages: number;
    estimatedCompletionTime?: string;
    processingRate?: number; // messages per minute
  }> {
    try {
      const mainQueueMetrics = await this.getQueueMetrics(EXISTING_QUEUES.TRANSACTION_PROCESSING);
      
      if (!mainQueueMetrics) {
        return {
          totalMessages: 0,
          processingMessages: 0,
          queuedMessages: 0,
        };
      }

      const queuedMessages = mainQueueMetrics.approximateNumberOfMessages;
      const processingMessages = mainQueueMetrics.approximateNumberOfMessagesNotVisible;
      const totalMessages = queuedMessages + processingMessages;

      // Estimate processing rate by monitoring queue depth changes
      // This is a simplified estimation - in production, you might want to store historical data
      let processingRate: number | undefined;
      let estimatedCompletionTime: string | undefined;

      if (queuedMessages > 0) {
        // Take a quick measurement to estimate processing rate
        const initialDepth = queuedMessages;
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        
        const updatedMetrics = await this.getQueueMetrics(EXISTING_QUEUES.TRANSACTION_PROCESSING);
        if (updatedMetrics) {
          const finalDepth = updatedMetrics.approximateNumberOfMessages;
          const processed = initialDepth - finalDepth;
          
          if (processed > 0) {
            processingRate = processed * 2; // messages per minute (30 seconds * 2)
            const remainingMinutes = queuedMessages / processingRate;
            estimatedCompletionTime = new Date(Date.now() + (remainingMinutes * 60 * 1000)).toISOString();
          }
        }
      }

      return {
        totalMessages,
        processingMessages,
        queuedMessages,
        estimatedCompletionTime,
        processingRate,
      };
    } catch (error: any) {
      console.error('Failed to get processing progress:', error);
      throw error;
    }
  }
}