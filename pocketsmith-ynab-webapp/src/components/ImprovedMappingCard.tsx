import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  TrendingUp as TrendingUpIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import type { AccountMappingDisplay } from '../types/accounts';

interface ImprovedMappingCardProps {
  mapping: AccountMappingDisplay;
  onDelete: (pocketsmithAccountId: string) => void;
  isDeleting?: boolean;
  isPending?: boolean;
}

export const ImprovedMappingCard: React.FC<ImprovedMappingCardProps> = ({
  mapping,
  onDelete,
  isDeleting = false,
  isPending = false,
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    if (isPending) return 'warning';
    return mapping.isActive ? 'success' : 'default';
  };

  const getStatusLabel = () => {
    if (isPending) return 'Pending';
    return mapping.isActive ? 'Active' : 'Inactive';
  };

  return (
    <Card
      sx={{
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        border: isPending ? `2px dashed ${theme.palette.warning.main}` : '1px solid',
        borderColor: isPending ? 'warning.main' : 'divider',
        backgroundColor: isPending ? alpha(theme.palette.warning.main, 0.02) : 'background.paper',
        height: '100%',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Status Chip */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Chip
            label={getStatusLabel()}
            color={getStatusColor()}
            size="small"
            sx={{
              fontWeight: 500,
              minWidth: 70,
            }}
          />
        </Box>

        {/* Account Connection Visual */}
        <Box sx={{ mb: 2, pr: 8 }}>
          {/* PocketSmith Account */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 36,
                height: 36,
                mr: 2,
              }}
            >
              <BankIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {mapping.pocketsmithAccountName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PocketSmith
              </Typography>
            </Box>
          </Box>

          {/* Connection Arrow */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              my: 1,
              color: isPending ? 'warning.main' : 'primary.main',
            }}
          >
            <LinkIcon sx={{ fontSize: 18 }} />
          </Box>

          {/* YNAB Account */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                width: 36,
                height: 36,
                mr: 2,
              }}
            >
              <TrendingUpIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {mapping.ynabAccountName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                YNAB
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Account IDs and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              pr: 1
            }}
          >
            PS: {mapping.pocketsmithAccountId} → YNAB: {mapping.ynabAccountId}
          </Typography>
          
          <IconButton
            onClick={() => onDelete(mapping.pocketsmithAccountId)}
            disabled={isDeleting}
            size="small"
            sx={{
              color: 'error.main',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};