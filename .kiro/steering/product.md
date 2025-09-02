# Product Overview

PocketSmith-YNAB Sync WebApp is a React-based management interface for synchronizing financial data between PocketSmith and YNAB (You Need A Budget) systems.

## Core Features

- **Account Management**: Configure and manage account mappings between PocketSmith and YNAB
- **Sync Monitoring**: Real-time monitoring of synchronization status and history
- **Balance Comparison**: Compare PocketSmith posted balances with YNAB cleared balances
- **Manual Sync Operations**: Trigger synchronization processes manually when needed
- **Responsive Design**: Full mobile, tablet, and desktop support

## Architecture

The solution consists of two main components:
- **Frontend**: React TypeScript webapp with Material-UI for user interface
- **Infrastructure**: AWS CDK-managed cloud infrastructure with Lambda functions, API Gateway, and Cognito authentication

## Target Users

Financial management users who need to keep their PocketSmith and YNAB accounts synchronized and want visibility into the sync process and data consistency.