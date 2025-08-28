import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Chip,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  PlayArrow,
  Warning,
  Schedule,
  AccountBalance,
  DateRange,
} from '@mui/icons-material';
import { syncApiService } from '../services/syncApi';
import { accountsApi } from '../services/accountsApi';
import type { SyncTriggerRequest, SyncTriggerResponse } from '../services/syncApi';
import type { PocketSmithAccount } from '../types/accounts';

interface ManualSyncDialogProps {
  open: boolean;
  onClose: () => void;
  onSyncTriggered: (response: SyncTriggerResponse) => void;
  currentQueueDepth?: number;
  syncInProgress?: boolean;
}

export const ManualSyncDialog: React.FC<ManualSyncDialogProps> = ({
  open,
  onClose,
  onSyncTriggered,
  currentQueueDepth = 0,
  syncInProgress = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<PocketSmithAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Form state
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [forceSync, setForceSync] = useState(false);

  // Load accounts when dialog opens
  useEffect(() => {
    if (open && accounts.length === 0) {
      loadAccounts();
    }
  }, [open]);

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      setError(null);
      const accountsData = await accountsApi.fetchAccounts();
      setAccounts(accountsData.pocketsmithAccounts);
    } catch (err: any) {
      setError(`Failed to load accounts: ${err.message}`);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setUseCustomDateRange(false);
    setStartDate(null);
    setEndDate(null);
    setSelectedAccountIds([]);
    setForceSync(false);
    setError(null);
  };

  const validateForm = (): string | null => {
    if (useCustomDateRange) {
      if (!startDate || !endDate) {
        return 'Both start and end dates are required when using custom date range';
      }
      
      if (startDate >= endDate) {
        return 'Start date must be before end date';
      }

      // Check date range limit (90 days)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 90) {
        return 'Date range cannot exceed 90 days';
      }

      // Warn about very old dates
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 6);
      if (startDate < monthsAgo) {
        return 'Warning: Syncing data older than 6 months may take a very long time';
      }
    }

    if (selectedAccountIds.length > 10) {
      return 'Cannot select more than 10 accounts at once';
    }

    return null;
  };

  const getEstimatedDuration = (): number => {
    let duration = 60; // Base 1 minute

    if (useCustomDateRange && startDate && endDate) {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      duration += days * 5; // ~5 seconds per day
    }

    if (selectedAccountIds.length > 0) {
      duration += selectedAccountIds.length * 10; // ~10 seconds per account
    } else {
      duration += accounts.length * 10; // All accounts if none selected
    }

    return Math.min(duration, 1800); // Cap at 30 minutes
  };

  const handleTriggerSync = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: SyncTriggerRequest = {
        forceSync,
      };

      if (useCustomDateRange && startDate && endDate) {
        request.dateRange = {
          startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
          endDate: endDate.toISOString().split('T')[0],
        };
      }

      if (selectedAccountIds.length > 0) {
        request.accountFilters = selectedAccountIds;
      }

      const response = await syncApiService.triggerSync(request);
      onSyncTriggered(response);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelection = (accountId: string) => {
    setSelectedAccountIds(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const estimatedDuration = getEstimatedDuration();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <PlayArrow color="primary" />
            <Typography variant="h6">Manual Sync Configuration</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Current Status Warning */}
          {(syncInProgress || currentQueueDepth > 0) && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              icon={<Warning />}
            >
              <Typography variant="subtitle2" gutterBottom>
                Sync Activity Detected
              </Typography>
              {syncInProgress && (
                <Typography variant="body2">
                  A sync operation is currently in progress. Enable "Force Sync" to override.
                </Typography>
              )}
              {currentQueueDepth > 0 && (
                <Typography variant="body2">
                  {currentQueueDepth} messages are currently queued for processing.
                </Typography>
              )}
            </Alert>
          )}

          {/* Date Range Configuration */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <DateRange color="primary" />
                <Typography variant="h6">Date Range</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={useCustomDateRange}
                    onChange={(e) => setUseCustomDateRange(e.target.checked)}
                    color="primary"
                  />
                }
                label="Use custom date range (default: last 7 days)"
                sx={{ mb: 2 }}
              />

              {useCustomDateRange && (
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!(startDate && endDate && startDate >= endDate),
                        helperText: startDate && endDate && startDate >= endDate ? 'Start date must be before end date' : ''
                      }
                    }}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    maxDate={new Date()}
                    minDate={startDate || undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      }
                    }}
                  />
                </Box>
              )}

              {useCustomDateRange && startDate && endDate && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Syncing {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days of data
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Account Selection */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <AccountBalance color="primary" />
                <Typography variant="h6">Account Selection</Typography>
              </Box>

              {loadingAccounts ? (
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress sx={{ flexGrow: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading accounts...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Select specific accounts to sync (leave empty to sync all mapped accounts)
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {accounts.map((account) => (
                      <Chip
                        key={account.id}
                        label={`${account.title} (${account.currency_code})`}
                        onClick={() => handleAccountSelection(account.id.toString())}
                        color={selectedAccountIds.includes(account.id.toString()) ? 'primary' : 'default'}
                        variant={selectedAccountIds.includes(account.id.toString()) ? 'filled' : 'outlined'}
                        size="small"
                      />
                    ))}
                  </Box>

                  {selectedAccountIds.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedAccountIds.length} account{selectedAccountIds.length !== 1 ? 's' : ''} selected
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Advanced Options
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={forceSync}
                    onChange={(e) => setForceSync(e.target.checked)}
                    color="warning"
                  />
                }
                label="Force sync (override existing sync operations)"
              />
              
              {forceSync && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Force sync will override any existing sync operations and may cause duplicate processing.
                    Use only when necessary.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sync Estimation */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Schedule color="info" />
                <Typography variant="h6">Sync Estimation</Typography>
              </Box>
              
              <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Duration
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {formatDuration(estimatedDuration)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Accounts to Process
                  </Typography>
                  <Typography variant="h6">
                    {selectedAccountIds.length || accounts.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Queue
                  </Typography>
                  <Typography variant="h6" color={currentQueueDepth > 50 ? 'warning.main' : 'text.primary'}>
                    {currentQueueDepth} messages
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTriggerSync}
            variant="contained"
            startIcon={loading ? <LinearProgress /> : <PlayArrow />}
            disabled={loading || loadingAccounts}
            color={forceSync ? 'warning' : 'primary'}
          >
            {loading ? 'Triggering...' : 'Trigger Sync'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ManualSyncDialog;