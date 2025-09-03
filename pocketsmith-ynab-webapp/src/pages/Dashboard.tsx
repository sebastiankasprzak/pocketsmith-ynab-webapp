import React, { useRef } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  AccountTree,
  AccountBalance,
  PlayArrow,
  TrendingUp,
  TrendingDown,
  Settings,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { StatusIndicator } from '../components/StatusIndicator';
import { ActivityFeed } from '../components/ActivityFeed';
import { DashboardNotifications } from '../components/DashboardNotifications';
import { useIOSDetection } from '../hooks/useIOSDetection';
import { IOSNavigationBar } from '../components/IOSNavigationBar';
import { IOSSection } from '../components/IOSSection';
import { IOSCard } from '../components/IOSCard';
import { IOSButton } from '../components/IOSButton';
import { IOSStatusBadge } from '../components/IOSStatusBadge';
import { IOSProgressIndicator } from '../components/IOSProgressIndicator';
import { IOSPullToRefresh } from '../components/IOSPullToRefresh';
import { IOSListItem } from '../components/IOSListItem';
import { IOSMetricCard } from '../components/IOSMetricCard';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dismissedNotifications, setDismissedNotifications] = React.useState<string[]>([]);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const { shouldUseIOSExperience } = useIOSDetection();
  
  // Use the custom hook for all dashboard data
  const {
    syncStatus,
    mappingStats,
    balanceDiscrepancies,
    recentActivity,
    metrics,
    syncMutation,
    refreshAllData
  } = useDashboardData();

  // Helper functions
  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Generate smart notifications based on data
  const notifications = React.useMemo(() => {
    const notifs = [];

    // API Error notifications
    if (syncStatus.error) {
      notifs.push({
        id: 'sync-api-error',
        type: 'error' as const,
        title: 'Unable to load sync status',
        message: 'There was an error connecting to the sync API. Some dashboard features may not be available.',
        dismissible: true
      });
    }

    if (mappingStats.error) {
      notifs.push({
        id: 'mapping-api-error',
        type: 'error' as const,
        title: 'Unable to load account mappings',
        message: 'There was an error loading account mapping data. Please check your API configuration.',
        action: {
          label: 'View Mappings',
          path: '/account-mappings'
        },
        dismissible: true
      });
    }

    if (balanceDiscrepancies.error) {
      notifs.push({
        id: 'balance-api-error',
        type: 'error' as const,
        title: 'Unable to load balance data',
        message: 'There was an error loading balance comparison data. Please try refreshing.',
        action: {
          label: 'View Balances',
          path: '/balance-comparison'
        },
        dismissible: true
      });
    }

    // Only show data-based notifications if we have data (no errors)
    if (!balanceDiscrepancies.error && balanceDiscrepancies.data && balanceDiscrepancies.data.length > 0) {
      const totalDiscrepancy = balanceDiscrepancies.data.reduce((sum, d) => sum + Math.abs(d.difference), 0);
      notifs.push({
        id: 'balance-discrepancies',
        type: 'warning' as const,
        title: `Found ${balanceDiscrepancies.data.length} balance discrepancies`,
        message: `Total discrepancy amount: ${formatCurrency(totalDiscrepancy, 'USD')}. Review and resolve these differences to ensure data accuracy.`,
        action: {
          label: 'View Details',
          path: '/balance-comparison'
        },
        dismissible: true
      });
    }

    // Unmapped accounts notification
    if (!mappingStats.error && mappingStats.data && mappingStats.data.unmapped > 0) {
      notifs.push({
        id: 'unmapped-accounts',
        type: 'info' as const,
        title: `${mappingStats.data.unmapped} accounts need mapping`,
        message: 'Complete account mappings to enable full synchronization between PocketSmith and YNAB.',
        action: {
          label: 'Configure Mappings',
          path: '/account-mappings'
        },
        dismissible: true
      });
    }

    // Sync error notification
    if (!syncStatus.error && syncStatus.data?.status === 'error') {
      notifs.push({
        id: 'sync-error',
        type: 'error' as const,
        title: 'Synchronization failed',
        message: syncStatus.data.message || 'An error occurred during synchronization. Check your API connections and try again.',
        action: {
          label: 'View Status',
          path: '/sync-status'
        },
        dismissible: false
      });
    }

    // Data freshness warning
    if (!metrics.error && metrics.data && metrics.data.dataFreshness > 60) {
      notifs.push({
        id: 'stale-data',
        type: 'warning' as const,
        title: 'Data may be outdated',
        message: `Data was last updated ${metrics.data.dataFreshness} minutes ago. Consider refreshing to get the latest information.`,
        dismissible: true
      });
    }

    // Filter out dismissed notifications
    return notifs.filter(n => !dismissedNotifications.includes(n.id));
  }, [
    balanceDiscrepancies.data, 
    balanceDiscrepancies.error,
    mappingStats.data, 
    mappingStats.error,
    syncStatus.data, 
    syncStatus.error,
    metrics.data, 
    metrics.error,
    dismissedNotifications, 
    formatCurrency
  ]);

  const handleDismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  // Handle refresh for pull-to-refresh
  const handleRefresh = async () => {
    await refreshAllData();
  };

  // Render iOS-style dashboard
  const renderIOSDashboard = () => (
    <Box>
      <IOSNavigationBar
        title="Dashboard"
        large={false}
      />
      
      {/* Smart Notifications */}
      <DashboardNotifications
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

        {/* Sync Status Section - iOS Grouped List Format */}
        <IOSSection title="Sync Status">
          <IOSListItem
            leftIcon={
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                backgroundColor: syncStatus.data?.status === 'syncing' ? '#007AFF' : 
                               syncStatus.data?.status === 'error' ? '#FF3B30' :
                               syncStatus.data?.status === 'success' ? '#34C759' : '#8E8E93',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PlayArrow sx={{ color: 'white', fontSize: '18px' }} />
              </Box>
            }
            rightContent={
              <IOSStatusBadge
                status={syncStatus.data?.status === 'syncing' ? 'syncing' : 
                       syncStatus.data?.status === 'error' ? 'error' :
                       syncStatus.data?.status === 'success' ? 'success' : 'inactive'}
                text={syncStatus.data?.status || 'idle'}
                animated={syncStatus.data?.status === 'syncing'}
                variant="minimal"
                size="small"
              />
            }
            showDisclosure={true}
            onClick={() => navigate('/sync-status')}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontSize: '17px', fontWeight: 400, mb: 0.5 }}>
                Synchronization
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '15px', mb: 1 }}>
                {syncStatus.data?.message || 'Ready to sync'}
              </Typography>
              {syncStatus.data?.progress !== undefined && (
                <IOSProgressIndicator
                  progress={syncStatus.data.progress}
                  variant="linear"
                  size="small"
                  showLabel={false}
                />
              )}
              {syncStatus.data?.lastSync && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '13px', mt: 0.5, display: 'block' }}>
                  Last sync: {formatTimeAgo(syncStatus.data.lastSync)}
                </Typography>
              )}
            </Box>
          </IOSListItem>
          
          <IOSListItem
            leftIcon={<PlayArrow sx={{ color: '#007AFF', fontSize: '20px' }} />}
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || syncStatus.data?.status === 'syncing'}
            divider={false}
          >
            <Typography variant="body1" sx={{ 
              fontSize: '17px', 
              fontWeight: 400,
              color: syncMutation.isPending || syncStatus.data?.status === 'syncing' ? 'text.disabled' : '#007AFF'
            }}>
              {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
            </Typography>
          </IOSListItem>
        </IOSSection>

        {/* Account Mappings Section - iOS Grouped List Format */}
        <IOSSection title="Account Mappings">
          <IOSListItem
            leftIcon={
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                backgroundColor: '#007AFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AccountTree sx={{ color: 'white', fontSize: '18px' }} />
              </Box>
            }
            rightContent={
              mappingStats.isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '15px' }}>
                  {mappingStats.data?.percentage || 0}%
                </Typography>
              )
            }
            showDisclosure={true}
            onClick={() => navigate('/account-mappings')}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontSize: '17px', fontWeight: 400, mb: 0.5 }}>
                Account Mappings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '15px', mb: 1 }}>
                {mappingStats.data ? 
                  `${mappingStats.data.mapped || 0} of ${mappingStats.data.total || 0} accounts mapped` :
                  'Configure account mappings'
                }
              </Typography>
              {!mappingStats.isLoading && mappingStats.data && (
                <IOSProgressIndicator
                  progress={mappingStats.data.percentage || 0}
                  variant="linear"
                  size="small"
                  showLabel={false}
                  color={mappingStats.data.percentage === 100 ? 'success' : 'primary'}
                />
              )}
            </Box>
          </IOSListItem>
          
          {!mappingStats.isLoading && mappingStats.data && mappingStats.data.unmapped > 0 && (
            <IOSListItem
              leftIcon={<Settings sx={{ color: '#FF9500', fontSize: '20px' }} />}
              rightContent={
                <IOSStatusBadge
                  status="warning"
                  text={`${mappingStats.data.unmapped}`}
                  variant="filled"
                  size="small"
                />
              }
              onClick={() => navigate('/account-mappings')}
              divider={false}
            >
              <Typography variant="body1" sx={{ fontSize: '17px', fontWeight: 400 }}>
                Configure Unmapped Accounts
              </Typography>
            </IOSListItem>
          )}
        </IOSSection>

        {/* Balance Comparison Section - iOS Grouped List Format */}
        <IOSSection title="Balance Comparison">
          <IOSListItem
            leftIcon={
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                backgroundColor: balanceDiscrepancies.error ? '#FF3B30' :
                               balanceDiscrepancies.data && balanceDiscrepancies.data.length > 0 ? '#FF9500' : '#34C759',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AccountBalance sx={{ color: 'white', fontSize: '18px' }} />
              </Box>
            }
            rightContent={
              balanceDiscrepancies.isLoading ? (
                <CircularProgress size={20} />
              ) : balanceDiscrepancies.error ? (
                <IOSStatusBadge
                  status="error"
                  text="Error"
                  variant="minimal"
                  size="small"
                />
              ) : balanceDiscrepancies.data && balanceDiscrepancies.data.length > 0 ? (
                <IOSStatusBadge
                  status="warning"
                  text={`${balanceDiscrepancies.data.length}`}
                  variant="filled"
                  size="small"
                />
              ) : (
                <IOSStatusBadge
                  status="success"
                  text="✓"
                  variant="minimal"
                  size="small"
                />
              )
            }
            showDisclosure={true}
            onClick={() => navigate('/balance-comparison')}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontSize: '17px', fontWeight: 400, mb: 0.5 }}>
                Balance Comparison
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '15px' }}>
                {balanceDiscrepancies.isLoading ? 'Loading balance data...' :
                 balanceDiscrepancies.error ? 'Unable to load balance data' :
                 balanceDiscrepancies.data && balanceDiscrepancies.data.length > 0 ? 
                   `${balanceDiscrepancies.data.length} discrepancies found` :
                   'All balances match perfectly'
                }
              </Typography>
            </Box>
          </IOSListItem>
          
          {/* Show top discrepancies as separate list items */}
          {!balanceDiscrepancies.isLoading && !balanceDiscrepancies.error && 
           balanceDiscrepancies.data && balanceDiscrepancies.data.length > 0 && (
            <>
              {balanceDiscrepancies.data.slice(0, 2).map((discrepancy, index) => (
                <IOSListItem
                  key={index}
                  leftIcon={
                    discrepancy.difference > 0 ? 
                      <TrendingUp sx={{ color: '#FF3B30', fontSize: '20px' }} /> : 
                      <TrendingDown sx={{ color: '#34C759', fontSize: '20px' }} />
                  }
                  rightContent={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '15px',
                        fontWeight: 600,
                        color: discrepancy.difference > 0 ? '#FF3B30' : '#34C759'
                      }}
                    >
                      {formatCurrency(Math.abs(discrepancy.difference), discrepancy.currency)}
                    </Typography>
                  }
                  onClick={() => navigate('/balance-comparison')}
                  divider={index < 1}
                >
                  <Typography variant="body1" sx={{ fontSize: '17px', fontWeight: 400 }}>
                    {discrepancy.accountName}
                  </Typography>
                </IOSListItem>
              ))}
            </>
          )}
        </IOSSection>

        {/* Key Metrics Section - iOS Style Metric Cards */}
        <IOSSection title="Key Metrics">
          {metrics.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <IOSMetricCard
                    value={metrics.data?.totalAccounts || 0}
                    label="Total Accounts"
                    color="primary"
                    icon={<AccountTree sx={{ fontSize: '24px' }} />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <IOSMetricCard
                    value={`${metrics.data?.successRate || 0}%`}
                    label="Success Rate"
                    color="success"
                    icon={<TrendingUp sx={{ fontSize: '24px' }} />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <IOSMetricCard
                    value={`${metrics.data?.avgSyncTime || 0}s`}
                    label="Avg Sync Time"
                    color="info"
                    icon={<PlayArrow sx={{ fontSize: '24px' }} />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <IOSMetricCard
                    value={`${metrics.data?.dataFreshness || 0}m`}
                    label="Data Age"
                    color={metrics.data && metrics.data.dataFreshness > 30 ? 'warning' : 'success'}
                    subtitle={metrics.data && metrics.data.dataFreshness > 30 ? 'Consider refreshing' : 'Up to date'}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </IOSSection>

        {/* Recent Activity Section */}
        <IOSSection title="Recent Activity">
          <Box sx={{ p: 2 }}>
            {recentActivity.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : recentActivity.data && recentActivity.data.length > 0 ? (
              <Box>
                {recentActivity.data.slice(0, 5).map((activity) => (
                  <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <StatusIndicator 
                      status={activity.status} 
                      showLabel={false}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '15px' }}>
                        {activity.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '13px' }}>
                        {formatTimeAgo(activity.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No recent activity
              </Typography>
            )}
          </Box>
        </IOSSection>

        <Box sx={{ pb: 4 }} />
    </Box>
  );

  // Render standard dashboard for non-iOS devices
  const renderStandardDashboard = () => (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body1" color="text.secondary">
            PocketSmith-YNAB Sync Manager
          </Typography>
          {metrics.data && (
            <Chip
              size="small"
              label={`Data updated ${metrics.data.dataFreshness}m ago`}
              color={metrics.data.dataFreshness > 30 ? 'warning' : 'success'}
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Smart Notifications */}
      <DashboardNotifications
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Main Action Cards */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Sync Status Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Sync Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {syncStatus.isLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <StatusIndicator 
                          status={syncStatus.data?.status || 'idle'}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, mb: 2 }}>
                    {syncStatus.data?.progress !== undefined && (
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress variant="determinate" value={syncStatus.data.progress} />
                        <Typography variant="caption" color="text.secondary">
                          {syncStatus.data.progress}% complete
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {syncStatus.data?.message || 'Ready to sync'}
                    </Typography>
                    
                    {syncStatus.data?.lastSync && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Last sync: {formatTimeAgo(syncStatus.data.lastSync)}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexDirection: { xs: 'column', sm: 'row' },
                    mt: 'auto'
                  }}>
                    <Button
                      variant="contained"
                      startIcon={syncMutation.isPending ? <CircularProgress size={16} /> : <PlayArrow />}
                      onClick={() => syncMutation.mutate()}
                      disabled={syncMutation.isPending || syncStatus.data?.status === 'syncing'}
                      size="small"
                      fullWidth={{ xs: true, sm: false }}
                    >
                      {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => navigate('/sync-status')}
                      size="small"
                      fullWidth={{ xs: true, sm: false }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Account Mappings Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Account Mappings</Typography>
                    <AccountTree color="primary" />
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, mb: 2 }}>
                    {mappingStats.isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={mappingStats.data?.percentage || 0}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Typography variant="h6" color="primary">
                            {mappingStats.data?.percentage || 0}%
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {mappingStats.data?.mapped || 0} of {mappingStats.data?.total || 0} accounts mapped
                        </Typography>
                        
                        {mappingStats.data && mappingStats.data.unmapped > 0 && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            {mappingStats.data.unmapped} accounts need mapping
                          </Alert>
                        )}
                        
                        {mappingStats.error && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            Unable to load mapping data
                          </Alert>
                        )}
                      </>
                    )}
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={<Settings />}
                    onClick={() => navigate('/account-mappings')}
                    size="small"
                    fullWidth
                    sx={{ mt: 'auto' }}
                  >
                    Configure Mappings
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Balance Comparison Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Balance Comparison</Typography>
                    <Badge 
                      badgeContent={balanceDiscrepancies.data?.length || 0} 
                      color="warning"
                      invisible={!balanceDiscrepancies.data?.length}
                    >
                      <AccountBalance color="primary" />
                    </Badge>
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, mb: 2 }}>
                    {balanceDiscrepancies.isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <>
                        {balanceDiscrepancies.error ? (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            Unable to load balance data
                          </Alert>
                        ) : balanceDiscrepancies.data && balanceDiscrepancies.data.length > 0 ? (
                          <>
                            <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                              {balanceDiscrepancies.data.length} discrepancies found
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              {balanceDiscrepancies.data.slice(0, 2).map((discrepancy, index) => (
                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {discrepancy.accountName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {discrepancy.difference > 0 ? <TrendingUp color="error" /> : <TrendingDown color="success" />}
                                    <Typography variant="caption" color={discrepancy.difference > 0 ? 'error.main' : 'success.main'}>
                                      {formatCurrency(Math.abs(discrepancy.difference), discrepancy.currency)}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                            {balanceDiscrepancies.data ? 'All balances match perfectly' : 'No balance data available'}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={() => navigate('/balance-comparison')}
                    size="small"
                    fullWidth
                    sx={{ mt: 'auto' }}
                  >
                    Compare Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Key Metrics Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: 3
                }}>
                  <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                  
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    {metrics.isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <Grid container spacing={2} sx={{ height: '100%' }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="primary">
                              {metrics.data?.totalAccounts || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total Accounts
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="success.main">
                              {metrics.data?.successRate || 0}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Success Rate
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="info.main">
                              {metrics.data?.avgSyncTime || 0}s
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Avg Sync Time
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography 
                              variant="h4" 
                              color={metrics.data && metrics.data.dataFreshness > 30 ? 'warning.main' : 'success.main'}
                            >
                              {metrics.data?.dataFreshness || 0}m
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Data Age
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Activity Feed */}
        <Grid item xs={12} lg={4}>
          <ActivityFeed
            activities={recentActivity.data || []}
            isLoading={recentActivity.isLoading}
            onRefresh={refreshAllData}
            title="Recent Activity"
            height={656} // 2 * 320 + 16 (gap between cards)
          />
        </Grid>
      </Grid>
    </Box>
  );

  return shouldUseIOSExperience ? renderIOSDashboard() : renderStandardDashboard();
};