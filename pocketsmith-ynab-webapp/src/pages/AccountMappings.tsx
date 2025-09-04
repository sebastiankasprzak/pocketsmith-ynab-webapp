import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme,
  useMediaQuery,
  Stack,
  Grid,
  Paper,
  Fade,
  Zoom,
  alpha,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  AccountBalance as BankIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { IOSSection } from '../components/IOSSection';
import { IOSCard } from '../components/IOSCard';
import { IOSListItem, createDeleteAction } from '../components/IOSListItem';
import { IOSButton } from '../components/IOSButton';
import { IOSMetricCard } from '../components/IOSMetricCard';
import { IOSNavigationBar } from '../components/IOSNavigationBar';
import { IOSFloatingActionButton } from '../components/IOSFloatingActionButton';
import { useIOSDetection } from '../hooks/useIOSDetection';
import { useAccounts, useMappings, useSaveMappings, useDeleteMapping, useValidateMappings, useUpdateMappingConfig } from '../hooks/useAccountMappings';
import { MappingConfigurationCard } from '../components/MappingConfigurationCard';
import { ImprovedMappingCard } from '../components/ImprovedMappingCard';
import { BudgetSelector } from '../components/BudgetSelector';
import { validateMappings } from '../utils/mappingValidation';
import type { AccountMappingCreate, PocketSmithAccount, YNABAccount } from '../types/accounts';

interface NewMappingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (mapping: AccountMappingCreate) => void;
  availablePocketSmithAccounts: PocketSmithAccount[];
  availableYnabAccounts: YNABAccount[];
}

const NewMappingDialog: React.FC<NewMappingDialogProps> = ({
  open,
  onClose,
  onSave,
  availablePocketSmithAccounts,
  availableYnabAccounts,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [pocketsmithAccountId, setPocketsmithAccountId] = useState('');
  const [ynabAccountId, setYnabAccountId] = useState('');

  const handleSave = () => {
    if (pocketsmithAccountId && ynabAccountId) {
      onSave({
        pocketsmithAccountId,
        ynabAccountId,
      });
      setPocketsmithAccountId('');
      setYnabAccountId('');
      onClose();
    }
  };

  const handleClose = () => {
    setPocketsmithAccountId('');
    setYnabAccountId('');
    onClose();
  };

  const selectedPsAccount = availablePocketSmithAccounts.find(a => a.id.toString() === pocketsmithAccountId);
  const selectedYnabAccount = availableYnabAccounts.find(a => a.id === ynabAccountId);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' },
            borderRadius: { xs: 0, sm: 3 },
          }
        }
      }}
    >
      <DialogTitle sx={{
        pb: 1,
        fontSize: { xs: '1.25rem', sm: '1.5rem' },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              color: 'primary.main',
            }}
          >
            <AddIcon />
          </Box>
          Create New Account Mapping
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 } }}>
        <Stack spacing={4}>
          {/* PocketSmith Account Selection */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select PocketSmith Account
            </Typography>
            <FormControl fullWidth size="large">
              <InputLabel>PocketSmith Account</InputLabel>
              <Select
                value={pocketsmithAccountId}
                onChange={(e) => setPocketsmithAccountId(e.target.value)}
                label="PocketSmith Account"
                sx={{ minHeight: 56 }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {availablePocketSmithAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <BankIcon color="primary" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {account.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.currency_code} • {account.type}
                          {account.institution && ` • ${account.institution.name}`}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Preview Selected PocketSmith Account */}
            {selectedPsAccount && (
              <Fade in={!!selectedPsAccount}>
                <Paper
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Selected PocketSmith Account
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedPsAccount.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Balance: {selectedPsAccount.current_balance} {selectedPsAccount.currency_code}
                  </Typography>
                </Paper>
              </Fade>
            )}
          </Box>

          {/* YNAB Account Selection */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select YNAB Account
            </Typography>
            <FormControl fullWidth size="large">
              <InputLabel>YNAB Account</InputLabel>
              <Select
                value={ynabAccountId}
                onChange={(e) => setYnabAccountId(e.target.value)}
                label="YNAB Account"
                sx={{ minHeight: 56 }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {availableYnabAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <TrendingUpIcon color="secondary" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {account.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.type} • {account.on_budget ? 'On Budget' : 'Off Budget'}
                          {account.closed && ' • CLOSED'}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Preview Selected YNAB Account */}
            {selectedYnabAccount && (
              <Fade in={!!selectedYnabAccount}>
                <Paper
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Selected YNAB Account
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedYnabAccount.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Balance: {(selectedYnabAccount.balance / 1000).toFixed(2)}
                  </Typography>
                </Paper>
              </Fade>
            )}
          </Box>

          {/* Mapping Preview */}
          {selectedPsAccount && selectedYnabAccount && (
            <Fade in={!!(selectedPsAccount && selectedYnabAccount)}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Mapping Preview
                </Typography>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: alpha(theme.palette.success.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <CheckCircleIcon color="success" />
                  <Typography variant="body1">
                    <strong>{selectedPsAccount.title}</strong> will sync to <strong>{selectedYnabAccount.name}</strong>
                  </Typography>
                </Paper>
              </Box>
            </Fade>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{
        px: { xs: 3, sm: 4 },
        pb: { xs: 3, sm: 3 },
        pt: 2,
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          onClick={handleClose}
          fullWidth={isMobile}
          size="large"
          sx={{ minHeight: 48 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!pocketsmithAccountId || !ynabAccountId}
          fullWidth={isMobile}
          size="large"
          startIcon={<AddIcon />}
          sx={{ minHeight: 48, minWidth: { sm: 180 } }}
        >
          Create Mapping
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AccountMappings: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { shouldUseIOSExperience } = useIOSDetection();

  const [newMappingDialogOpen, setNewMappingDialogOpen] = useState(false);
  const [pendingMappings, setPendingMappings] = useState<AccountMappingCreate[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Fetch data
  const { data: accountsData, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useAccounts();
  const { data: mappingsData, isLoading: mappingsLoading, error: mappingsError, refetch: refetchMappings } = useMappings();

  // Mutations
  const saveMappingsMutation = useSaveMappings();
  const deleteMappingMutation = useDeleteMapping();
  const validateMappingsMutation = useValidateMappings();
  const updateConfigMutation = useUpdateMappingConfig();

  // Compute available accounts (not already mapped)
  const availableAccounts = useMemo(() => {
    if (!accountsData || !mappingsData || !mappingsData.mappings) {
      return { pocketsmith: [], ynab: [] };
    }

    const mappedPocketSmithIds = new Set(mappingsData.mappings.map(m => m.pocketsmithAccountId));
    const mappedYnabIds = new Set(mappingsData.mappings.map(m => m.ynabAccountId));

    return {
      pocketsmith: accountsData.pocketsmithAccounts.filter(
        account => !mappedPocketSmithIds.has(account.id.toString())
      ),
      ynab: accountsData.ynabAccounts.filter(
        account => !mappedYnabIds.has(account.id) && !account.closed
      ),
    };
  }, [accountsData, mappingsData]);

  const handleAddMapping = (mapping: AccountMappingCreate) => {
    setPendingMappings(prev => [...prev, mapping]);
  };

  const handleRemovePendingMapping = (index: number) => {
    setPendingMappings(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteMapping = async (pocketsmithAccountId: string) => {
    try {
      await deleteMappingMutation.mutateAsync(pocketsmithAccountId);
      showSnackbar('Mapping deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to delete mapping', 'error');
    }
  };

  const handleSaveMappings = async () => {
    if (pendingMappings.length === 0) return;

    // First, perform client-side validation
    if (accountsData && mappingsData && mappingsData.mappings) {
      const existingMappings = mappingsData.mappings.map(m => ({
        pocketsmithAccountId: m.pocketsmithAccountId,
        ynabAccountId: m.ynabAccountId
      }));

      const clientValidation = validateMappings(pendingMappings, {
        pocketsmithAccounts: accountsData.pocketsmithAccounts,
        ynabAccounts: accountsData.ynabAccounts,
        existingMappings
      });

      if (!clientValidation.valid) {
        const errorMessage = clientValidation.errors && clientValidation.errors.length > 0 
          ? clientValidation.errors.join(', ')
          : 'Unknown validation error';
        showSnackbar(`Validation failed: ${errorMessage}`, 'error');
        return;
      }

      // Show warnings if any
      if (clientValidation.warnings.length > 0) {
        // You could show warnings to the user here if desired
      }
    }

    try {
      // Server-side validation
      const serverValidation = await validateMappingsMutation.mutateAsync(pendingMappings);

      if (!serverValidation.valid) {
        const errorMessage = serverValidation.errors && serverValidation.errors.length > 0 
          ? serverValidation.errors.join(', ')
          : 'Unknown validation error';
        showSnackbar(`Server validation failed: ${errorMessage}`, 'error');
        return;
      }

      // Save mappings
      await saveMappingsMutation.mutateAsync(pendingMappings);
      setPendingMappings([]);
      showSnackbar('Mappings saved successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save mappings';
      showSnackbar(errorMessage, 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleConfigSave = async (config: { default_account_id?: string; strict_mode: boolean }) => {
    await updateConfigMutation.mutateAsync(config);
  };

  const handleRefresh = () => {
    refetchAccounts();
    refetchMappings();
  };

  const isLoading = accountsLoading || mappingsLoading;
  const hasError = accountsError || mappingsError;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load account data. Please check your API configuration and try again.
        </Alert>
        <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }

  const totalMappings = (mappingsData?.mappings?.length || 0) + pendingMappings.length;

  // Render iOS-style layout when appropriate
  if (shouldUseIOSExperience) {
    return (
      <Box sx={{ 
        position: 'relative', 
        pb: isMobile ? 10 : 0,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* iOS Navigation Bar */}
        <IOSNavigationBar
          title="Account Mappings"
          large={true}
          rightAction={
            <IOSButton
              variant="plain"
              size="small"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh
            </IOSButton>
          }
        />

        {/* Statistics Section */}
        <IOSSection title="Statistics" grouped={false}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <IOSMetricCard
                value={totalMappings}
                label="Total Mappings"
                color="primary"
                icon={<BankIcon />}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <IOSMetricCard
                value={mappingsData?.mappings?.filter(m => m.isActive).length || 0}
                label="Active"
                color="success"
                icon={<CheckCircleIcon />}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <IOSMetricCard
                value={pendingMappings.length}
                label="Pending"
                color="warning"
                icon={<TrendingUpIcon />}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <IOSMetricCard
                value={availableAccounts.pocketsmith.length}
                label="Available"
                color="info"
                icon={<AddIcon />}
              />
            </Grid>
          </Grid>
        </IOSSection>

        {/* Account Mappings Section */}
        <IOSSection 
          title={`Account Mappings (${totalMappings})`}
          headerAction={
            pendingMappings.length > 0 ? (
              <IOSButton
                variant="primary"
                size="small"
                onClick={handleSaveMappings}
                disabled={saveMappingsMutation.isPending}
              >
                Save ({pendingMappings.length})
              </IOSButton>
            ) : undefined
          }
        >
          {(!mappingsData?.mappings || mappingsData.mappings.length === 0) && pendingMappings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <BankIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Account Mappings
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Create your first mapping to start syncing accounts between PocketSmith and YNAB.
              </Typography>
              <IOSButton
                variant="primary"
                onClick={() => setNewMappingDialogOpen(true)}
                disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
              >
                Create First Mapping
              </IOSButton>
              {(availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0) && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  {availableAccounts.pocketsmith.length === 0 && availableAccounts.ynab.length === 0
                    ? 'No accounts available from either PocketSmith or YNAB'
                    : availableAccounts.pocketsmith.length === 0
                    ? 'No PocketSmith accounts available'
                    : 'No YNAB accounts available'
                  }
                </Typography>
              )}
            </Box>
          ) : (
            <>
              {/* Existing mappings */}
              {mappingsData?.mappings?.map((mapping) => (
                <IOSListItem
                  key={mapping.pocketsmithAccountId}
                  leftIcon={<BankIcon color="primary" />}
                  showDisclosure={true}
                  swipeActions={[createDeleteAction(() => handleDeleteMapping(mapping.pocketsmithAccountId))]}
                  divider={true}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {mapping.pocketsmithAccountName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      → {mapping.ynabAccountName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: mapping.isActive ? 'success.main' : 'text.secondary',
                        fontWeight: 500 
                      }}
                    >
                      {mapping.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                </IOSListItem>
              ))}

              {/* Pending mappings */}
              {pendingMappings.map((mapping, index) => {
                const psAccount = accountsData?.pocketsmithAccounts.find(
                  a => a.id.toString() === mapping.pocketsmithAccountId
                );
                const ynabAccount = accountsData?.ynabAccounts.find(
                  a => a.id === mapping.ynabAccountId
                );

                return (
                  <IOSListItem
                    key={`pending-${index}`}
                    leftIcon={<AddIcon color="warning" />}
                    swipeActions={[createDeleteAction(() => handleRemovePendingMapping(index))]}
                    divider={true}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {psAccount?.title || 'Unknown Account'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        → {ynabAccount?.name || 'Unknown Account'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'warning.main',
                          fontWeight: 500 
                        }}
                      >
                        Pending
                      </Typography>
                    </Box>
                  </IOSListItem>
                );
              })}
            </>
          )}
        </IOSSection>

        {/* Configuration Settings Section */}
        {mappingsData?.config && accountsData?.ynabAccounts && (
          <IOSSection title="Mapping Settings" grouped={false}>
            <Box sx={{ mx: 2 }}>
              <MappingConfigurationCard
                config={mappingsData.config}
                ynabAccounts={accountsData.ynabAccounts}
                onSave={handleConfigSave}
                isLoading={isLoading}
              />
            </Box>
          </IOSSection>
        )}

        {/* Budget Selection Section */}
        <IOSSection title="Budget Configuration" grouped={false}>
          <Box sx={{ mx: 2 }}>
            <BudgetSelector 
              currentBudgetId={accountsData?.currentBudgetId}
              onBudgetChange={() => {
                refetchAccounts();
                refetchMappings();
              }}
            />
          </Box>
        </IOSSection>

        {/* iOS Floating Action Button */}
        <IOSFloatingActionButton
          onClick={() => setNewMappingDialogOpen(true)}
          disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
        >
          <AddIcon />
        </IOSFloatingActionButton>

        {/* New Mapping Dialog */}
        <NewMappingDialog
          open={newMappingDialogOpen}
          onClose={() => setNewMappingDialogOpen(false)}
          onSave={handleAddMapping}
          availablePocketSmithAccounts={availableAccounts.pocketsmith}
          availableYnabAccounts={availableAccounts.ynab}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Fallback to original Material-UI layout for non-iOS devices
  return (
    <Box sx={{ 
      position: 'relative', 
      pb: isMobile ? 10 : 0,
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Account Mappings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Configure how your PocketSmith accounts sync with YNAB accounts.
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {totalMappings}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Mappings
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {mappingsData?.mappings?.filter(m => m.isActive).length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {pendingMappings.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {availableAccounts.pocketsmith.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Mobile Add Mapping Button */}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setNewMappingDialogOpen(true)}
            startIcon={<AddIcon />}
            disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
            fullWidth
            size="large"
          >
            Add New Mapping
          </Button>
        </Box>

        {/* Action Buttons */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ 
            justifyContent: 'flex-end',
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={isLoading}
            fullWidth={isMobile}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={() => setNewMappingDialogOpen(true)}
            startIcon={<AddIcon />}
            disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Add Mapping
          </Button>
          {pendingMappings.length > 0 && (
            <Button
              variant="contained"
              onClick={handleSaveMappings}
              disabled={saveMappingsMutation.isPending}
              sx={{ minWidth: { sm: 140 } }}
              color="success"
              fullWidth={isMobile}
            >
              Save Changes ({pendingMappings.length})
            </Button>
          )}
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Current Mappings */}
        <Card>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Account Mappings ({totalMappings})
              </Typography>
            }
          />
          <CardContent>
            {(!mappingsData?.mappings || mappingsData.mappings.length === 0) && pendingMappings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <BankIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Account Mappings
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Create your first mapping to start syncing accounts between PocketSmith and YNAB.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setNewMappingDialogOpen(true)}
                  startIcon={<AddIcon />}
                  disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
                  size="large"
                  sx={{ minWidth: 200 }}
                >
                  Create First Mapping
                </Button>
                {(availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0) && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    {availableAccounts.pocketsmith.length === 0 && availableAccounts.ynab.length === 0
                      ? 'No accounts available from either PocketSmith or YNAB'
                      : availableAccounts.pocketsmith.length === 0
                      ? 'No PocketSmith accounts available'
                      : 'No YNAB accounts available'
                    }
                  </Typography>
                )}
              </Box>
            ) : (
              <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                {/* Existing mappings */}
                {mappingsData?.mappings?.map((mapping) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    lg={4} 
                    key={mapping.pocketsmithAccountId} 
                    sx={{ display: 'flex', height: 'auto' }}
                  >
                    <Box sx={{ width: '100%', display: 'flex' }}>
                      <ImprovedMappingCard
                        mapping={mapping}
                        onDelete={handleDeleteMapping}
                        isDeleting={deleteMappingMutation.isPending}
                      />
                    </Box>
                  </Grid>
                ))}

                {/* Pending mappings */}
                {pendingMappings.map((mapping, index) => {
                  const psAccount = accountsData?.pocketsmithAccounts.find(
                    a => a.id.toString() === mapping.pocketsmithAccountId
                  );
                  const ynabAccount = accountsData?.ynabAccounts.find(
                    a => a.id === mapping.ynabAccountId
                  );

                  const pendingMapping = {
                    pocketsmithAccountId: mapping.pocketsmithAccountId,
                    pocketsmithAccountName: psAccount?.title || 'Unknown Account',
                    ynabAccountId: mapping.ynabAccountId,
                    ynabAccountName: ynabAccount?.name || 'Unknown Account',
                    isActive: true,
                  };

                  return (
                    <Grid 
                      item 
                      xs={12} 
                      sm={6} 
                      lg={4} 
                      key={`pending-${index}`} 
                      sx={{ display: 'flex', height: 'auto' }}
                    >
                      <Box sx={{ width: '100%', display: 'flex' }}>
                        <ImprovedMappingCard
                          mapping={pendingMapping}
                          onDelete={() => handleRemovePendingMapping(index)}
                          isPending={true}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Configuration Settings */}
        {mappingsData?.config && accountsData?.ynabAccounts && (
          <MappingConfigurationCard
            config={mappingsData.config}
            ynabAccounts={accountsData.ynabAccounts}
            onSave={handleConfigSave}
            isLoading={isLoading}
          />
        )}

        {/* Budget Selection */}
        <Card>
          <CardContent>
            <BudgetSelector 
              currentBudgetId={accountsData?.currentBudgetId}
              onBudgetChange={() => {
                // Refresh accounts and mappings after budget change
                refetchAccounts();
                refetchMappings();
              }}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => setNewMappingDialogOpen(true)}
          disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
        >
          <AddIcon />
        </Fab>
      )}

      {/* New Mapping Dialog */}
      <NewMappingDialog
        open={newMappingDialogOpen}
        onClose={() => setNewMappingDialogOpen(false)}
        onSave={handleAddMapping}
        availablePocketSmithAccounts={availableAccounts.pocketsmith}
        availableYnabAccounts={availableAccounts.ynab}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};