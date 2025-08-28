import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  CloudQueue as CloudQueueIcon,
} from '@mui/icons-material';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { analyticsService } from '../services/analyticsService';
import { errorLoggingService } from '../services/errorLoggingService';

interface MetricCard {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'error';
  description?: string;
}

interface SystemHealth {
  api: 'healthy' | 'degraded' | 'down';
  auth: 'healthy' | 'degraded' | 'down';
  sync: 'healthy' | 'degraded' | 'down';
  frontend: 'healthy' | 'degraded' | 'down';
}

export const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api: 'healthy',
    auth: 'healthy',
    sync: 'healthy',
    frontend: 'healthy',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { trackInteraction, trackMemoryUsage, trackBundleMetrics } = usePerformanceMonitor('monitoring-dashboard');

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMetrics = async () => {
    await trackInteraction('load_metrics', async () => {
      try {
        setIsLoading(true);
        
        // Simulate loading metrics (in real implementation, this would call CloudWatch APIs)
        const mockMetrics: MetricCard[] = [
          {
            title: 'API Response Time',
            value: 245,
            unit: 'ms',
            trend: 'stable',
            status: 'success',
            description: 'Average API response time over the last 5 minutes',
          },
          {
            title: 'Error Rate',
            value: 0.2,
            unit: '%',
            trend: 'down',
            status: 'success',
            description: 'Percentage of failed requests',
          },
          {
            title: 'Active Users',
            value: 12,
            trend: 'up',
            status: 'success',
            description: 'Currently authenticated users',
          },
          {
            title: 'Sync Operations',
            value: 156,
            trend: 'up',
            status: 'success',
            description: 'Successful sync operations today',
          },
          {
            title: 'Memory Usage',
            value: 68,
            unit: '%',
            trend: 'stable',
            status: 'warning',
            description: 'Current memory utilization',
          },
          {
            title: 'Cache Hit Rate',
            value: 94.5,
            unit: '%',
            trend: 'up',
            status: 'success',
            description: 'CloudFront cache hit rate',
          },
        ];

        // Simulate system health check
        const mockHealth: SystemHealth = {
          api: Math.random() > 0.1 ? 'healthy' : 'degraded',
          auth: Math.random() > 0.05 ? 'healthy' : 'degraded',
          sync: Math.random() > 0.15 ? 'healthy' : 'degraded',
          frontend: 'healthy',
        };

        setMetrics(mockMetrics);
        setSystemHealth(mockHealth);
        setLastUpdated(new Date());

        // Track successful metrics load
        analyticsService.trackUserAction({
          action: 'metrics_loaded',
          category: 'monitoring',
          value: mockMetrics.length,
        });

      } catch (error) {
        errorLoggingService.logError(error as Error, {
          page: 'monitoring-dashboard',
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleRefresh = () => {
    trackInteraction('manual_refresh', () => {
      loadMetrics();
    });
  };

  const handleAutoRefreshToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(event.target.checked);
    analyticsService.trackUserAction({
      action: 'auto_refresh_toggle',
      category: 'monitoring',
      label: event.target.checked ? 'enabled' : 'disabled',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'degraded': return <WarningIcon color="warning" />;
      case 'down': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" />;
      case 'down': return <TrendingUpIcon color="error" sx={{ transform: 'rotate(180deg)' }} />;
      default: return null;
    }
  };

  const handleMemoryCheck = () => {
    trackMemoryUsage();
    trackBundleMetrics();
    analyticsService.trackUserAction({
      action: 'memory_check',
      category: 'monitoring',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Monitoring
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                color="primary"
              />
            }
            label="Auto Refresh"
          />
          <Tooltip title="Refresh metrics">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Check memory usage">
            <IconButton onClick={handleMemoryCheck}>
              <MemoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Last Updated */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Last updated: {lastUpdated.toLocaleTimeString()}
      </Typography>

      {/* System Health Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Health
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getHealthIcon(systemHealth.api)}
                <Typography>API Gateway</Typography>
                <Chip 
                  label={systemHealth.api} 
                  size="small" 
                  color={getStatusColor(systemHealth.api === 'healthy' ? 'success' : systemHealth.api === 'degraded' ? 'warning' : 'error')}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getHealthIcon(systemHealth.auth)}
                <Typography>Authentication</Typography>
                <Chip 
                  label={systemHealth.auth} 
                  size="small" 
                  color={getStatusColor(systemHealth.auth === 'healthy' ? 'success' : systemHealth.auth === 'degraded' ? 'warning' : 'error')}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getHealthIcon(systemHealth.sync)}
                <Typography>Sync Service</Typography>
                <Chip 
                  label={systemHealth.sync} 
                  size="small" 
                  color={getStatusColor(systemHealth.sync === 'healthy' ? 'success' : systemHealth.sync === 'degraded' ? 'warning' : 'error')}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getHealthIcon(systemHealth.frontend)}
                <Typography>Frontend</Typography>
                <Chip 
                  label={systemHealth.frontend} 
                  size="small" 
                  color={getStatusColor(systemHealth.frontend === 'healthy' ? 'success' : systemHealth.frontend === 'degraded' ? 'warning' : 'error')}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Metrics Grid */}
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                    {metric.title}
                  </Typography>
                  {getTrendIcon(metric.trend)}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <Typography variant="h4" component="div" color="primary">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </Typography>
                  {metric.unit && (
                    <Typography variant="body2" color="text.secondary">
                      {metric.unit}
                    </Typography>
                  )}
                </Box>

                {metric.status && (
                  <Chip 
                    label={metric.status} 
                    size="small" 
                    color={getStatusColor(metric.status)}
                    sx={{ mb: 1 }}
                  />
                )}

                {metric.description && (
                  <Typography variant="body2" color="text.secondary">
                    {metric.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Alerts Section */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Active Alerts
        </Typography>
        
        {systemHealth.api === 'degraded' && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            API Gateway is experiencing degraded performance. Response times may be slower than usual.
          </Alert>
        )}
        
        {systemHealth.sync === 'degraded' && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Sync service is experiencing issues. Some sync operations may fail or be delayed.
          </Alert>
        )}
        
        {metrics.find(m => m.title === 'Error Rate' && Number(m.value) > 1) && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Error rate is above normal threshold. Check application logs for details.
          </Alert>
        )}
        
        {metrics.find(m => m.title === 'Memory Usage' && Number(m.value) > 80) && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Memory usage is high. Consider optimizing application performance.
          </Alert>
        )}

        {/* Show success message if no alerts */}
        {systemHealth.api === 'healthy' && 
         systemHealth.auth === 'healthy' && 
         systemHealth.sync === 'healthy' && 
         systemHealth.frontend === 'healthy' && 
         !metrics.find(m => (m.title === 'Error Rate' && Number(m.value) > 1) || (m.title === 'Memory Usage' && Number(m.value) > 80)) && (
          <Alert severity="success">
            All systems are operating normally. No active alerts.
          </Alert>
        )}
      </Box>
    </Box>
  );
};