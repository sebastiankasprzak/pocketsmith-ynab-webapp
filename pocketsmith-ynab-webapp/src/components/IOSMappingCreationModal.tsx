import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { IOSBottomSheet } from './IOSBottomSheet';
import { IOSButton } from './IOSButton';
import { IOSModalPicker } from './IOSModalPicker';
import { IOSCard } from './IOSCard';
import { IOSSection } from './IOSSection';
import { IOSActionSheet } from './IOSActionSheet';
import { IOSFormField } from './IOSFormValidation';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { AccountMappingCreate, PocketSmithAccount, YNABAccount } from '../types/accounts';

interface IOSMappingCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (mapping: AccountMappingCreate) => void;
  availablePocketSmithAccounts: PocketSmithAccount[];
  availableYnabAccounts: YNABAccount[];
}

interface FormErrors {
  pocketsmithAccount?: string;
  ynabAccount?: string;
  general?: string;
}

export const IOSMappingCreationModal: React.FC<IOSMappingCreationModalProps> = React.memo(({
  open,
  onClose,
  onSave,
  availablePocketSmithAccounts,
  availableYnabAccounts,
}) => {
  const { triggerHaptic } = useHapticFeedback();

  // Form state
  const [pocketsmithAccountId, setPocketsmithAccountId] = useState('');
  const [ynabAccountId, setYnabAccountId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Convert accounts to picker options
  const pocketsmithOptions = useMemo(() => 
    availablePocketSmithAccounts.map(account => ({
      label: account.title,
      value: account.id.toString(),
      subtitle: `${account.currency_code} • ${account.type}${account.institution ? ` • ${account.institution.name}` : ''}`,
      icon: <BankIcon color="primary" />
    })), [availablePocketSmithAccounts]
  );

  const ynabOptions = useMemo(() => 
    availableYnabAccounts.map(account => ({
      label: account.name,
      value: account.id,
      subtitle: `${account.type} • ${account.on_budget ? 'On Budget' : 'Off Budget'}${account.closed ? ' • CLOSED' : ''}`,
      icon: <TrendingUpIcon color="secondary" />
    })), [availableYnabAccounts]
  );

  // Get selected accounts
  const selectedPsAccount = availablePocketSmithAccounts.find(a => a.id.toString() === pocketsmithAccountId);
  const selectedYnabAccount = availableYnabAccounts.find(a => a.id === ynabAccountId);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!pocketsmithAccountId) {
      newErrors.pocketsmithAccount = 'Please select a PocketSmith account';
    }

    if (!ynabAccountId) {
      newErrors.ynabAccount = 'Please select a YNAB account';
    }

    // Check for currency mismatch (if available)
    if (selectedPsAccount && selectedYnabAccount) {
      // Note: YNAB doesn't expose currency in the API, so we can't validate currency mismatch
      // This is where additional validation could be added in the future
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    setShowConfirmation(true);
  };

  const handleConfirmSave = () => {
    onSave({
      pocketsmithAccountId,
      ynabAccountId,
    });
    handleClose();
  };

  const handleClose = () => {
    setPocketsmithAccountId('');
    setYnabAccountId('');
    setErrors({});
    setShowConfirmation(false);
    onClose();
  };

  const handlePocketSmithChange = (value: string) => {
    // Use requestAnimationFrame to prevent iOS scroll issues
    requestAnimationFrame(() => {
      setPocketsmithAccountId(value);
      if (errors.pocketsmithAccount) {
        setErrors(prev => ({ ...prev, pocketsmithAccount: undefined }));
      }
    });
  };

  const handleYnabChange = (value: string) => {
    // Use requestAnimationFrame to prevent iOS scroll issues
    requestAnimationFrame(() => {
      setYnabAccountId(value);
      if (errors.ynabAccount) {
        setErrors(prev => ({ ...prev, ynabAccount: undefined }));
      }
    });
  };

  return (
    <>
      {/* Main Creation Modal */}
      <IOSBottomSheet
        open={open && !showConfirmation}
        onClose={handleClose}
        title="Create Account Mapping"
        showCloseButton={true}
      >
        <Box sx={{ px: 3, pb: 3 }}>
          <Stack spacing={4}>
            {/* Instructions */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Select accounts from PocketSmith and YNAB to create a new mapping for synchronization.
              </Typography>
            </Box>

            {/* PocketSmith Account Selection */}
            <IOSSection title="PocketSmith Account" grouped={false}>
              <IOSFormField error={errors.pocketsmithAccount}>
                <IOSModalPicker
                  label="Select PocketSmith Account"
                  options={pocketsmithOptions}
                  value={pocketsmithAccountId}
                  onChange={handlePocketSmithChange}
                  placeholder="Choose an account..."
                  error={!!errors.pocketsmithAccount}
                  showIcons={true}
                  showSubtitles={true}
                />
              </IOSFormField>
            </IOSSection>

            {/* YNAB Account Selection */}
            <IOSSection title="YNAB Account" grouped={false}>
              <IOSFormField error={errors.ynabAccount}>
                <IOSModalPicker
                  label="Select YNAB Account"
                  options={ynabOptions}
                  value={ynabAccountId}
                  onChange={handleYnabChange}
                  placeholder="Choose an account..."
                  error={!!errors.ynabAccount}
                  showIcons={true}
                  showSubtitles={true}
                />
              </IOSFormField>
            </IOSSection>

            {/* Mapping Preview */}
            {selectedPsAccount && selectedYnabAccount && (
              <Box
                sx={{
                  opacity: selectedPsAccount && selectedYnabAccount ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  pointerEvents: selectedPsAccount && selectedYnabAccount ? 'auto' : 'none',
                }}
              >
                <IOSSection title="Mapping Preview" grouped={false}>
                  <IOSCard elevated={false}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      backgroundColor: 'success.light',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'success.main'
                    }}>
                      <CheckCircleIcon color="success" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedPsAccount.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          will sync to
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedYnabAccount.name}
                        </Typography>
                      </Box>
                    </Box>
                  </IOSCard>
                </IOSSection>
              </Box>
            )}

            {/* General Error */}
            {errors.general && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {errors.general}
              </Alert>
            )}

            {/* Action Buttons */}
            <Stack spacing={2}>
              <IOSButton
                variant="primary"
                onClick={handleSave}
                disabled={!pocketsmithAccountId || !ynabAccountId}
                fullWidth
                size="large"
              >
                Create Mapping
              </IOSButton>
              <IOSButton
                variant="secondary"
                onClick={handleClose}
                fullWidth
                size="large"
              >
                Cancel
              </IOSButton>
            </Stack>
          </Stack>
        </Box>
      </IOSBottomSheet>

      {/* Confirmation Action Sheet */}
      <IOSActionSheet
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Account Mapping"
        message={selectedPsAccount && selectedYnabAccount ? 
          `Create mapping between "${selectedPsAccount.title}" and "${selectedYnabAccount.name}"?` : 
          'Create this account mapping?'
        }
        actions={[
          {
            label: 'Create Mapping',
            onPress: handleConfirmSave,
            destructive: false
          }
        ]}
        cancelLabel="Cancel"
      />
    </>
  );
});

IOSMappingCreationModal.displayName = 'IOSMappingCreationModal';

export default IOSMappingCreationModal;