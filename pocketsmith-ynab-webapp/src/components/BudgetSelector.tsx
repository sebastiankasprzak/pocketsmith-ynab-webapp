import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { SafeSelect } from './SafeSelect';
import {
  AccountBalance as BudgetIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useYNABBudgets, useUpdateYNABBudgetId } from '../hooks/useAccountMappings';
import type { YNABBudget } from '../types/accounts';

interface BudgetSelectorProps {
  currentBudgetId?: string;
  onBudgetChange?: (budgetId: string, budgetName: string) => void;
}

export const BudgetSelector: React.FC<BudgetSelectorProps> = ({
  currentBudgetId,
  onBudgetChange,
}) => {
  const [, setSelectedBudgetId] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<YNABBudget | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const { data: budgetsData, isLoading: budgetsLoading, error: budgetsError } = useYNABBudgets();
  const updateBudgetMutation = useUpdateYNABBudgetId();

  const handleBudgetSelect = (budgetId: string) => {
    const budget = budgetsData?.budgets.find(b => b.id === budgetId);
    if (budget) {
      setSelectedBudgetId(budgetId);
      setSelectedBudget(budget);
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmBudgetChange = async () => {
    if (!selectedBudget) return;

    try {
      await updateBudgetMutation.mutateAsync(selectedBudget.id);
      setConfirmDialogOpen(false);
      setSnackbarMessage(`Successfully switched to budget: ${selectedBudget.name}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      if (onBudgetChange) {
        onBudgetChange(selectedBudget.id, selectedBudget.name);
      }
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to update budget');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCancelBudgetChange = () => {
    setConfirmDialogOpen(false);
    setSelectedBudgetId('');
    setSelectedBudget(null);
  };

  if (budgetsError) {
    return (
      <Alert severity="error">
        Failed to load YNAB budgets. Please check your YNAB API configuration.
      </Alert>
    );
  }

  if (budgetsLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading YNAB budgets...
        </Typography>
      </Box>
    );
  }

  if (!budgetsData?.budgets || budgetsData.budgets.length === 0) {
    return (
      <Alert severity="info">
        No YNAB budgets found. Please ensure you have at least one budget in your YNAB account.
      </Alert>
    );
  }

  const currentBudget = budgetsData.budgets.find(b => b.id === currentBudgetId);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BudgetIcon color="primary" />
        YNAB Budget Selection
      </Typography>

      {/* Current Budget Display */}
      {currentBudget ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current Budget:
          </Typography>
          <Box
            sx={{
              p: 2,
              border: '2px solid',
              borderColor: 'success.main',
              borderRadius: 2,
              backgroundColor: 'success.50',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CheckIcon color="success" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.dark' }}>
                {currentBudget.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentBudget.currency_format.iso_code} • Last modified: {new Date(currentBudget.last_modified_on).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No budget is currently selected. Please select a budget to continue.
        </Alert>
      )}

      {/* Budget Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          Change Budget:
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Select Different YNAB Budget</InputLabel>
          <SafeSelect
            value=""
            onChange={(e) => handleBudgetSelect(e.target.value)}
            label="Select Different YNAB Budget"
            disabled={updateBudgetMutation.isPending}
          >
            {budgetsData.budgets.map((budget) => (
              <MenuItem 
                key={budget.id} 
                value={budget.id}
                disabled={budget.id === currentBudgetId}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {budget.id === currentBudgetId && <CheckIcon color="success" />}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {budget.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {budget.currency_format.iso_code} • Last modified: {new Date(budget.last_modified_on).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </SafeSelect>
        </FormControl>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Changing the budget will reload all account mappings and may require reconfiguration.
      </Typography>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelBudgetChange}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Budget Change
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to switch to the budget "{selectedBudget?.name}"?
          </Typography>
          <Alert severity="warning">
            This will reload all account mappings and may require you to reconfigure your account mappings.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBudgetChange}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBudgetChange}
            variant="contained"
            disabled={updateBudgetMutation.isPending}
            startIcon={updateBudgetMutation.isPending ? <CircularProgress size={16} /> : undefined}
          >
            {updateBudgetMutation.isPending ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

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