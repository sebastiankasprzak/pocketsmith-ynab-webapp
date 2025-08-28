#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

// Get environment from context (default to 'staging')
const environment = app.node.tryGetContext('environment') || 'staging';

// Validate environment
if (!['staging', 'production'].includes(environment)) {
  throw new Error(`Invalid environment: ${environment}. Must be 'staging' or 'production'`);
}

// Deploy main infrastructure stack
const infraStack = new InfrastructureStack(app, `PocketSmithYnabSyncStack-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `PocketSmith-YNAB Sync WebApp infrastructure for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'PocketSmith-YNAB-Sync',
    Component: 'WebApp',
  },
});

// Deploy monitoring stack
new MonitoringStack(app, `PocketSmithYnabSyncMonitoring-${environment}`, {
  environment,
  apiGateway: infraStack.api,
  lambdaFunctions: infraStack.lambdaFunctions,
  cloudFrontDistribution: infraStack.distribution,
  alertEmail: process.env.ALERT_EMAIL, // Optional: set via environment variable
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `PocketSmith-YNAB Sync WebApp monitoring for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'PocketSmith-YNAB-Sync',
    Component: 'Monitoring',
  },
});