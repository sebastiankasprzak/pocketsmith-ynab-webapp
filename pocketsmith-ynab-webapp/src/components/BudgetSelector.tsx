import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
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
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
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
        YNAB Budget
      </Typography>

      {currentBudget && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Currently using budget: <strong>{currentBudget.name}</strong>
        </Alert>
      )}

      <FormControl fullWidth>
        <InputLabel>Select YNAB Budget</InputLabel>
        <Select
          value=""
          onChange={(e) => handleBudgetSelect(e.target.value)}
          label="Select YNAB Budget"
          disabled={updateBudgetMutation.isPending}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
              },
            },
          }}
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
        </Select>
      </FormControl>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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