import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

export interface MonitoringStackProps extends cdk.StackProps {
  environment: string;
  apiGateway: apigateway.RestApi;
  lambdaFunctions: lambda.Function[];
  cloudFrontDistribution: cloudfront.Distribution;
  alertEmail?: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environment, apiGateway, lambdaFunctions, cloudFrontDistribution, alertEmail } = props;

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `pocketsmith-ynab-webapp-alerts-${environment}`,
      displayName: `PocketSmith-YNAB WebApp Alerts (${environment})`,
    });

    // Add email subscription if provided
    if (alertEmail) {
      this.alertTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(alertEmail)
      );
    }

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'WebAppDashboard', {
      dashboardName: `PocketSmithYnabWebApp-${environment}`,
    });

    // API Gateway Metrics
    this.addApiGatewayMetrics(apiGateway);

    // Lambda Function Metrics
    this.addLambdaMetrics(lambdaFunctions);

    // CloudFront Metrics
    this.addCloudFrontMetrics(cloudFrontDistribution);

    // Custom Application Metrics
    this.addCustomMetrics();

    // Create Alarms
    this.createAlarms(apiGateway, lambdaFunctions, cloudFrontDistribution);
  }

  private addApiGatewayMetrics(api: apigateway.RestApi) {
    // API Gateway request metrics
    const apiRequestsWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    // API Gateway latency metrics
    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Latency',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'IntegrationLatency',
          dimensionsMap: {
            ApiName: api.restApiName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    this.dashboard.addWidgets(apiRequestsWidget, apiLatencyWidget);
  }

  private addLambdaMetrics(functions: lambda.Function[]) {
    functions.forEach((func, index) => {
      // Lambda invocation metrics
      const lambdaInvocationsWidget = new cloudwatch.GraphWidget({
        title: `Lambda Invocations - ${func.functionName}`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: func.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: func.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Throttles',
            dimensionsMap: {
              FunctionName: func.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      });

      // Lambda duration metrics
      const lambdaDurationWidget = new cloudwatch.GraphWidget({
        title: `Lambda Duration - ${func.functionName}`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: func.functionName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      });

      this.dashboard.addWidgets(lambdaInvocationsWidget, lambdaDurationWidget);
    });
  }

  private addCloudFrontMetrics(distribution: cloudfront.Distribution) {
    // CloudFront request metrics
    const cloudFrontRequestsWidget = new cloudwatch.GraphWidget({
      title: 'CloudFront Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: 'Requests',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '4xxErrorRate',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '5xxErrorRate',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    // CloudFront cache metrics
    const cloudFrontCacheWidget = new cloudwatch.GraphWidget({
      title: 'CloudFront Cache Performance',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: 'CacheHitRate',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: 'OriginLatency',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    this.dashboard.addWidgets(cloudFrontRequestsWidget, cloudFrontCacheWidget);
  }

  private addCustomMetrics() {
    // Custom application metrics widget
    const customMetricsWidget = new cloudwatch.GraphWidget({
      title: 'Application Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'PocketSmithYnabWebApp',
          metricName: 'UserLogins',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'PocketSmithYnabWebApp',
          metricName: 'SyncOperations',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'PocketSmithYnabWebApp',
          metricName: 'BalanceComparisons',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'PocketSmithYnabWebApp',
          metricName: 'ConfigurationChanges',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    // Error rate metrics
    const errorRateWidget = new cloudwatch.GraphWidget({
      title: 'Application Error Rates',
      left: [
        new cloudwatch.Metric({
          namespace: 'PocketSmithYnabWebApp',
          metricName: 'AuthenticationErrors',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'PocketSmithYnabWebApp',
          metricName: 'ApiErrors',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    this.dashboard.addWidgets(customMetricsWidget, errorRateWidget);
  }

  private createAlarms(
    api: apigateway.RestApi,
    functions: lambda.Function[],
    distribution: cloudfront.Distribution
  ) {
    // API Gateway 5XX Error Alarm
    new cloudwatch.Alarm(this, 'ApiGateway5XXAlarm', {
      alarmName: `API-Gateway-5XX-Errors-${api.restApiName}`,
      alarmDescription: 'API Gateway 5XX error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: api.restApiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // API Gateway High Latency Alarm
    new cloudwatch.Alarm(this, 'ApiGatewayLatencyAlarm', {
      alarmName: `API-Gateway-High-Latency-${api.restApiName}`,
      alarmDescription: 'API Gateway latency is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiName: api.restApiName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Lambda Function Error Alarms
    functions.forEach((func, index) => {
      new cloudwatch.Alarm(this, `LambdaErrorAlarm-${index}`, {
        alarmName: `Lambda-Errors-${func.functionName}`,
        alarmDescription: `Lambda function ${func.functionName} error rate is too high`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: func.functionName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 3,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

      // Lambda Duration Alarm
      new cloudwatch.Alarm(this, `LambdaDurationAlarm-${index}`, {
        alarmName: `Lambda-Duration-${func.functionName}`,
        alarmDescription: `Lambda function ${func.functionName} duration is too high`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: {
            FunctionName: func.functionName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 25000, // 25 seconds (close to timeout)
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
    });

    // CloudFront 5XX Error Rate Alarm
    new cloudwatch.Alarm(this, 'CloudFront5XXAlarm', {
      alarmName: `CloudFront-5XX-Errors-${distribution.distributionId}`,
      alarmDescription: 'CloudFront 5XX error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: '5xxErrorRate',
        dimensionsMap: {
          DistributionId: distribution.distributionId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5, // 5% error rate
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Authentication Error Alarm
    new cloudwatch.Alarm(this, 'AuthenticationErrorAlarm', {
      alarmName: 'Authentication-Errors-High',
      alarmDescription: 'Authentication error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'PocketSmithYnabWebApp',
        metricName: 'AuthenticationErrors',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
  }
}