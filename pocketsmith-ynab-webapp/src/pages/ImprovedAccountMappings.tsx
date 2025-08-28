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
import { useAccounts, useMappings, useSaveMappings, useDeleteMapping, useValidateMappings, useUpdateMappingConfig } from '../hooks/useAccountMappings';
import { ImprovedMappingConfigurationCard } from '../components/ImprovedMappingConfigurationCard';
import { ImprovedMappingCard } from '../components/ImprovedMappingCard';
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
      
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <Grid container spacing={3}>
          {/* PocketSmith Account Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>PocketSmith Account</InputLabel>
              <Select
                value={pocketsmithAccountId}
                onChange={(e) => setPocketsmithAccountId(e.target.value)}
                label="PocketSmith Account"
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
          </Grid>

          {/* YNAB Account Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>YNAB Account</InputLabel>
              <Select
                value={ynabAccountId}
                onChange={(e) => setYnabAccountId(e.target.value)}
                label="YNAB Account"
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
          </Grid>
        </Grid>

        {/* Mapping Preview */}
        {selectedPsAccount && selectedYnabAccount && (
          <Fade in={!!(selectedPsAccount && selectedYnabAccount)}>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Mapping Preview
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <CheckCircleIcon color="success" />
                <Typography variant="body2">
                  <strong>{selectedPsAccount.title}</strong> will sync to <strong>{selectedYnabAccount.name}</strong>
                </Typography>
              </Paper>
            </Box>
          </Fade>
        )}
      </DialogContent>
      
      <DialogActions sx={{
        px: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 2 },
        gap: 1,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          onClick={handleClose}
          fullWidth={isMobile}
          size="large"
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
        >
          Create Mapping
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ImprovedAccountMappings: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

    // Client-side validation
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

  return (
    <Box sx={{ position: 'relative', pb: isMobile ? 10 : 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
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

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={isLoading}
          >
            Refresh
          </Button>
          {pendingMappings.length > 0 && (
            <Button
              variant="contained"
              onClick={handleSaveMappings}
              disabled={saveMappingsMutation.isPending}
              sx={{ minWidth: 140 }}
            >
              Save Changes ({pendingMappings.length})
            </Button>
          )}
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Configuration Settings */}
        {mappingsData?.config && accountsData?.ynabAccounts && (
          <ImprovedMappingConfigurationCard
            config={mappingsData.config}
            ynabAccounts={accountsData.ynabAccounts}
            onSave={handleConfigSave}
            isLoading={isLoading}
          />
        )}

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
                >
                  Create First Mapping
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Existing mappings */}
                {mappingsData?.mappings?.map((mapping) => (
                  <Grid item xs={12} lg={6} key={mapping.pocketsmithAccountId}>
                    <ImprovedMappingCard
                      mapping={mapping}
                      onDelete={handleDeleteMapping}
                      isDeleting={deleteMappingMutation.isPending}
                    />
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
                    <Grid item xs={12} lg={6} key={`pending-${index}`}>
                      <ImprovedMappingCard
                        mapping={pendingMapping}
                        onDelete={() => handleRemovePendingMapping(index)}
                        isPending={true}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
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