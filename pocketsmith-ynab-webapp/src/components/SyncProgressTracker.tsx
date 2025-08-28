import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Error,
  Warning,
  Sync,
  ExpandMore,
  ExpandLess,
  Schedule,
  CloudDownload,
  CloudUpload,
  Assessment
} from '@mui/icons-material';
import { CircularProgressWithLabel, PulsingDot } from './LoadingStates';
import { useToast } from './ToastNotifications';

export interface SyncStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  progress?: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  error?: string;
  details?: string[];
  metrics?: Record<string, number>;
}

export interface SyncProgress {
  syncId: string;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled';
  overallProgress: number; // 0-100
  currentStep: number;
  steps: SyncStep[];
  startTime: Date;
  endTime?: Date;
  totalTransactions?: number;
  processedTransactions?: number;
  failedTransactions?: number;
  duplicatesSkipped?: number;
  estimatedTimeRemaining?: number; // in seconds
  queueDepth?: number;
}

interface SyncProgressTrackerProps {
  open: boolean;
  onClose: () => void;
  syncProgress: SyncProgress | null;
  onCancel?: () => void;
  allowCancel?: boolean;
  showDetails?: boolean;
}

export const SyncProgressTracker: React.FC<SyncProgressTrackerProps> = ({
  open,
  onClose,
  syncProgress,
  onCancel,
  allowCancel = true,
  showDetails = true
}) => {
  const [showStepDetails, setShowStepDetails] = useState<Record<string, boolean>>({});
  const { showSuccess, showError } = useToast();

  // Auto-close on completion
  useEffect(() => {
    if (syncProgress?.status === 'completed') {
      const timer = setTimeout(() => {
        showSuccess(
          `Sync completed successfully! Processed ${syncProgress.processedTransactions || 0} transactions.`,
          'Sync Complete'
        );
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    } else if (syncProgress?.status === 'failed') {
      showError(
        'Sync operation failed. Please check the details and try again.',
        'Sync Failed',
        true
      );
    }
  }, [syncProgress?.status, syncProgress?.processedTransactions, onClose, showSuccess, showError]);

  const toggleStepDetails = useCallback((stepId: string) => {
    setShowStepDetails(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  }, []);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  const getStepIcon = (step: SyncStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'active':
        return <Sync sx={{ animation: 'spin 1s linear infinite' }} color="primary" />;
      case 'skipped':
        return <Warning color="warning" />;
      default:
        return <Schedule color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
      case 'active':
        return 'primary';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!syncProgress) return null;

  const duration = syncProgress.endTime 
    ? (syncProgress.endTime.getTime() - syncProgress.startTime.getTime()) / 1000
    : (new Date().getTime() - syncProgress.startTime.getTime()) / 1000;

  return (
    <Dialog
      open={open}
      onClose={syncProgress.status === 'running' ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            Sync Progress
          </Typography>
          <Chip
            label={syncProgress.status}
            color={getStatusColor(syncProgress.status) as any}
            size="small"
            icon={syncProgress.status === 'running' ? <PulsingDot color="primary" /> : undefined}
          />
        </Box>
        
        {syncProgress.status !== 'running' && (
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Overall Progress */}
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">Overall Progress</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDuration(duration)} elapsed
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={syncProgress.overallProgress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <CircularProgressWithLabel
                    value={syncProgress.overallProgress}
                    size={60}
                    thickness={6}
                  />
                </Box>

                {/* Metrics */}
                {(syncProgress.totalTransactions || syncProgress.processedTransactions) && (
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {syncProgress.totalTransactions && (
                      <Chip
                        icon={<Assessment />}
                        label={`Total: ${syncProgress.totalTransactions}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {syncProgress.processedTransactions !== undefined && (
                      <Chip
                        icon={<CloudUpload />}
                        label={`Processed: ${syncProgress.processedTransactions}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {syncProgress.failedTransactions !== undefined && syncProgress.failedTransactions > 0 && (
                      <Chip
                        icon={<Error />}
                        label={`Failed: ${syncProgress.failedTransactions}`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                    {syncProgress.duplicatesSkipped !== undefined && syncProgress.duplicatesSkipped > 0 && (
                      <Chip
                        icon={<Warning />}
                        label={`Skipped: ${syncProgress.duplicatesSkipped}`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                )}

                {/* Estimated time remaining */}
                {syncProgress.estimatedTimeRemaining && syncProgress.status === 'running' && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Estimated time remaining: {formatDuration(syncProgress.estimatedTimeRemaining)}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Step Progress */}
          {showDetails && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Sync Steps
                </Typography>
                
                <Stepper activeStep={syncProgress.currentStep} orientation="vertical">
                  {syncProgress.steps.map((step, index) => (
                    <Step key={step.id}>
                      <StepLabel
                        icon={getStepIcon(step)}
                        error={step.status === 'failed'}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {step.label}
                          </Typography>
                          {step.progress !== undefined && step.status === 'active' && (
                            <Typography variant="body2" color="text.secondary">
                              ({Math.round(step.progress)}%)
                            </Typography>
                          )}
                          {step.details && step.details.length > 0 && (
                            <IconButton
                              size="small"
                              onClick={() => toggleStepDetails(step.id)}
                            >
                              {showStepDetails[step.id] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          )}
                        </Box>
                      </StepLabel>
                      
                      <StepContent>
                        <Stack spacing={1}>
                          {step.description && (
                            <Typography variant="body2" color="text.secondary">
                              {step.description}
                            </Typography>
                          )}
                          
                          {step.progress !== undefined && step.status === 'active' && (
                            <LinearProgress
                              variant="determinate"
                              value={step.progress}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          )}
                          
                          {step.error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {step.error}
                            </Alert>
                          )}
                          
                          {step.metrics && Object.keys(step.metrics).length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {Object.entries(step.metrics).map(([key, value]) => (
                                <Chip
                                  key={key}
                                  label={`${key}: ${value}`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          )}
                          
                          {step.details && step.details.length > 0 && (
                            <Collapse in={showStepDetails[step.id]}>
                              <List dense>
                                {step.details.map((detail, detailIndex) => (
                                  <ListItem key={detailIndex}>
                                    <ListItemIcon>
                                      <CloudDownload fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={detail}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Collapse>
                          )}
                          
                          {step.startTime && (
                            <Typography variant="caption" color="text.secondary">
                              {step.endTime 
                                ? `Completed in ${formatDuration((step.endTime.getTime() - step.startTime.getTime()) / 1000)}`
                                : `Started ${step.startTime.toLocaleTimeString()}`
                              }
                            </Typography>
                          )}
                        </Stack>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          )}

          {/* Queue Status */}
          {syncProgress.queueDepth !== undefined && (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="subtitle2">Queue Status:</Typography>
                  <Chip
                    label={`${syncProgress.queueDepth} messages`}
                    size="small"
                    color={syncProgress.queueDepth > 0 ? 'warning' : 'success'}
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {allowCancel && syncProgress.status === 'running' && onCancel && (
          <Button onClick={onCancel} color="warning">
            Cancel Sync
          </Button>
        )}
        
        <Button
          onClick={onClose}
          variant={syncProgress.status === 'running' ? 'outlined' : 'contained'}
          disabled={syncProgress.status === 'running'}
        >
          {syncProgress.status === 'running' ? 'Running...' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Hook for managing sync progress
export const useSyncProgress = () => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const startTracking = useCallback((initialProgress: SyncProgress) => {
    setSyncProgress(initialProgress);
    setIsTracking(true);
  }, []);

  const updateProgress = useCallback((updates: Partial<SyncProgress>) => {
    setSyncProgress(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const updateStep = useCallback((stepId: string, stepUpdates: Partial<SyncStep>) => {
    setSyncProgress(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        steps: prev.steps.map(step =>
          step.id === stepId ? { ...step, ...stepUpdates } : step
        )
      };
    });
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    // Keep progress data for a bit longer for final display
    setTimeout(() => setSyncProgress(null), 5000);
  }, []);

  return {
    syncProgress,
    isTracking,
    startTracking,
    updateProgress,
    updateStep,
    stopTracking
  };
};