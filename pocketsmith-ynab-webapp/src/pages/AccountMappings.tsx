import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Chip,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAccounts, useMappings, useSaveMappings, useDeleteMapping, useValidateMappings, useUpdateMappingConfig } from '../hooks/useAccountMappings';
import { MappingConfigurationCard } from '../components/MappingConfigurationCard';
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={useMediaQuery('(max-width:600px)')}
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' }
          }
        }
      }}
    >
      <DialogTitle sx={{
        pb: 1,
        fontSize: { xs: '1.25rem', sm: '1.5rem' }
      }}>
        Create New Account Mapping
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {account.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.currency_code} • {account.type}
                      {account.institution && ` • ${account.institution.name}`}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {account.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.type} • {account.on_budget ? 'On Budget' : 'Off Budget'}
                      {account.closed && ' • CLOSED'}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{
        px: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 2 },
        gap: 1,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          onClick={handleClose}
          fullWidth={useMediaQuery('(max-width:600px)')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!pocketsmithAccountId || !ynabAccountId}
          fullWidth={useMediaQuery('(max-width:600px)')}
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
        <CircularProgress />
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

  return (
    <Box sx={{ position: 'relative', pb: isMobile ? 10 : 0 }}>
      {/* Header - responsive layout */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Account Mappings
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Configure how your PocketSmith accounts map to YNAB accounts for synchronization.
          </Typography>
        </Box>

        {/* Desktop buttons */}
        <Box sx={{
          display: { xs: 'none', sm: 'flex' },
          gap: 1,
          flexShrink: 0
        }}>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={() => setNewMappingDialogOpen(true)}
            startIcon={<AddIcon />}
            disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
          >
            Add Mapping
          </Button>
        </Box>

        {/* Mobile buttons */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ display: { xs: 'flex', sm: 'none' } }}
        >
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={isLoading}
            size="small"
            fullWidth
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={() => setNewMappingDialogOpen(true)}
            startIcon={<AddIcon />}
            disabled={availableAccounts.pocketsmith.length === 0 || availableAccounts.ynab.length === 0}
            size="small"
            fullWidth
          >
            Add Mapping
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Configuration Settings */}
        {mappingsData?.config && accountsData?.ynabAccounts && (
          <MappingConfigurationCard
            config={mappingsData.config}
            ynabAccounts={accountsData.ynabAccounts}
            onSave={handleConfigSave}
            isLoading={isLoading}
          />
        )}

        {/* Current Mappings */}
        <Card>
          <CardHeader
            title="Current Account Mappings"
            action={
              pendingMappings.length > 0 && (
                <Button
                  variant="contained"
                  onClick={handleSaveMappings}
                  startIcon={<SaveIcon />}
                  disabled={saveMappingsMutation.isPending}
                >
                  Save Changes ({pendingMappings.length})
                </Button>
              )
            }
          />
          <CardContent>
            {(!mappingsData?.mappings || mappingsData.mappings.length === 0) && pendingMappings.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No account mappings configured. Click "Add Mapping" to get started.
              </Typography>
            ) : (
              <List>
                {/* Existing mappings */}
                {mappingsData?.mappings?.map((mapping) => (
                  <ListItem
                    key={mapping.pocketsmithAccountId}
                    divider
                    sx={{
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      py: { xs: 2, sm: 1 },
                      gap: { xs: 1, sm: 0 }
                    }}
                  >
                    <ListItemText
                      sx={{ flex: 1 }}
                      primary={
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: { xs: 1, sm: 2 },
                          mb: { xs: 1, sm: 0 }
                        }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {mapping.pocketsmithAccountName}
                          </Typography>
                          <LinkIcon
                            color="primary"
                            sx={{
                              display: { xs: 'none', sm: 'block' },
                              fontSize: '1.2rem'
                            }}
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 500,
                              pl: { xs: 2, sm: 0 }
                            }}
                          >
                            {mapping.ynabAccountName}
                          </Typography>
                          <Chip
                            label={mapping.isActive ? 'Active' : 'Inactive'}
                            color={mapping.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: { xs: 'none', sm: 'block' },
                            fontSize: '0.75rem'
                          }}
                        >
                          PocketSmith ID: {mapping.pocketsmithAccountId} → YNAB ID: {mapping.ynabAccountId}
                        </Typography>
                      }
                    />
                    <IconButton
                      onClick={() => handleDeleteMapping(mapping.pocketsmithAccountId)}
                      disabled={deleteMappingMutation.isPending}
                      sx={{
                        alignSelf: { xs: 'flex-end', sm: 'center' },
                        mt: { xs: 1, sm: 0 },
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'error.contrastText'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
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
                    <ListItem
                      key={`pending-${index}`}
                      divider
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        py: { xs: 2, sm: 1 },
                        gap: { xs: 1, sm: 0 }
                      }}
                    >
                      <ListItemText
                        sx={{ flex: 1 }}
                        primary={
                          <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: { xs: 1, sm: 2 },
                            mb: { xs: 1, sm: 0 }
                          }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {psAccount?.title || 'Unknown Account'}
                            </Typography>
                            <LinkIcon
                              color="warning"
                              sx={{
                                display: { xs: 'none', sm: 'block' },
                                fontSize: '1.2rem'
                              }}
                            />
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 500,
                                pl: { xs: 2, sm: 0 }
                              }}
                            >
                              {ynabAccount?.name || 'Unknown Account'}
                            </Typography>
                            <Chip
                              label="Pending"
                              color="warning"
                              size="small"
                              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: { xs: 'none', sm: 'block' },
                              fontSize: '0.75rem'
                            }}
                          >
                            PocketSmith ID: {mapping.pocketsmithAccountId} → YNAB ID: {mapping.ynabAccountId}
                          </Typography>
                        }
                      />
                      <IconButton
                        onClick={() => handleRemovePendingMapping(index)}
                        sx={{
                          alignSelf: { xs: 'flex-end', sm: 'center' },
                          mt: { xs: 1, sm: 0 },
                          color: 'warning.main',
                          '&:hover': {
                            backgroundColor: 'warning.light',
                            color: 'warning.contrastText'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Available Accounts Overview */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 2, md: 3 }
        }}>
          <Card>
            <CardHeader
              title={
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                >
                  Available PocketSmith Accounts
                </Typography>
              }
            />
            <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
              {availableAccounts.pocketsmith.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  All PocketSmith accounts are already mapped.
                </Typography>
              ) : (
                <List dense={isMobile}>
                  {availableAccounts.pocketsmith.map((account) => (
                    <ListItem
                      key={account.id}
                      sx={{
                        px: { xs: 0, sm: 2 },
                        py: { xs: 1, sm: 1 }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            {account.title}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {account.currency_code} • {account.type}
                            {account.institution && (
                              <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
                                {isMobile ? account.institution.name : ` • ${account.institution.name}`}
                              </Box>
                            )}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                >
                  Available YNAB Accounts
                </Typography>
              }
            />
            <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
              {availableAccounts.ynab.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  All active YNAB accounts are already mapped.
                </Typography>
              ) : (
                <List dense={isMobile}>
                  {availableAccounts.ynab.map((account) => (
                    <ListItem
                      key={account.id}
                      sx={{
                        px: { xs: 0, sm: 2 },
                        py: { xs: 1, sm: 1 }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            {account.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {account.type} • {account.on_budget ? 'On Budget' : 'Off Budget'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

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