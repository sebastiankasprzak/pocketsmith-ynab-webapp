import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Collapse, 
  Divider,
  IconButton
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon,
  AccountBalance as AccountIcon,
  Schedule as TimeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { IOSCard } from './IOSCard';
import { IOSButton } from './IOSButton';
import { IOSStatusBadge } from './IOSStatusBadge';
import { IOSDiscrepancyBadge } from './IOSDiscrepancyBadge';
import type { BalanceComparison } from '../types/accounts';

interface IOSDetailDisclosureProps {
  comparison: BalanceComparison;
  expanded?: boolean;
  onToggle?: () => void;
  onInvestigate?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const IOSDetailDisclosure: React.FC<IOSDetailDisclosureProps> = ({
  comparison,
  expanded = false,
  onToggle,
  onInvestigate,
  onEdit,
  className = ''
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get discrepancy level
  const getDiscrepancyLevel = () => {
    if (!comparison.hasDiscrepancy) return 'none';
    
    const absAmount = Math.abs(comparison.difference);
    if (absAmount >= 1000) return 'critical';
    if (absAmount >= 100) return 'major';
    if (absAmount >= 10) return 'moderate';
    return 'minor';
  };

  // Handle toggle
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.();
  };

  // Get possible causes for discrepancy
  const getPossibleCauses = () => {
    const causes = [];
    
    if (comparison.hasDiscrepancy) {
      if (comparison.difference > 0) {
        causes.push('Pending transactions in PocketSmith not yet cleared');
        causes.push('Uncleared transactions in YNAB');
        causes.push('Different transaction posting times');
      } else {
        causes.push('Transactions cleared in YNAB but not posted in PocketSmith');
        causes.push('Manual adjustments in YNAB');
        causes.push('Different account balance calculation methods');
      }
      causes.push('Currency conversion differences');
      causes.push('Sync timing differences');
    }
    
    return causes;
  };

  const discrepancyLevel = getDiscrepancyLevel();
  const possibleCauses = getPossibleCauses();

  return (
    <IOSCard
      className={`ios-detail-disclosure ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}
      elevated={isExpanded}
      sx={{
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        border: comparison.hasDiscrepancy 
          ? `1px solid ${isDark ? 'rgba(255, 149, 0, 0.3)' : 'rgba(255, 149, 0, 0.2)'}`
          : undefined,
        backgroundColor: comparison.hasDiscrepancy && isExpanded
          ? isDark ? 'rgba(255, 149, 0, 0.05)' : 'rgba(255, 149, 0, 0.02)'
          : undefined
      }}
    >
      {/* Header - Always visible */}
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: 2,
          '&:active': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <AccountIcon sx={{ 
            color: 'text.secondary',
            fontSize: '20px'
          }} />
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ 
              fontWeight: 500,
              fontSize: '16px'
            }}>
              {comparison.pocketsmithAccountName || 'Unknown Account'}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontSize: '13px'
            }}>
              → {comparison.ynabAccountName || 'Unknown Account'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IOSDiscrepancyBadge
            amount={comparison.difference}
            currency={comparison.currency}
            level={discrepancyLevel}
            size="small"
            showDirection={comparison.hasDiscrepancy}
          />
          
          <IconButton
            size="small"
            sx={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
              color: 'text.secondary'
            }}
          >
            <ChevronRightIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Details */}
      <Collapse in={isExpanded} timeout={300}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ mb: 2 }} />
          
          {/* Balance Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              fontSize: '15px',
              fontWeight: 600,
              mb: 2,
              color: 'text.primary'
            }}>
              Balance Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  PocketSmith Balance:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 500,
                  fontFamily: 'monospace'
                }}>
                  {formatCurrency(comparison.pocketsmithBalance, comparison.currency)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  YNAB Cleared Balance:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 500,
                  fontFamily: 'monospace'
                }}>
                  {formatCurrency(comparison.ynabBalance, comparison.currency)}
                </Typography>
              </Box>
              
              {comparison.hasDiscrepancy && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ 
                      color: 'warning.main',
                      fontWeight: 500
                    }}>
                      Difference:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {comparison.difference > 0 ? (
                        <TrendingUpIcon sx={{ fontSize: '16px', color: 'error.main' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: '16px', color: 'primary.main' }} />
                      )}
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        color: comparison.difference > 0 ? 'error.main' : 'primary.main'
                      }}>
                        {comparison.difference > 0 ? '+' : ''}
                        {formatCurrency(comparison.difference, comparison.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* Last Updated */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Last updated {formatRelativeTime(comparison.lastUpdated)}
              </Typography>
            </Box>
          </Box>

          {/* Possible Causes (only for discrepancies) */}
          {comparison.hasDiscrepancy && possibleCauses.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                fontSize: '15px',
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <InfoIcon sx={{ fontSize: '16px' }} />
                Possible Causes
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                {possibleCauses.map((cause, index) => (
                  <Typography 
                    key={index}
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      mb: 0.5,
                      fontSize: '13px',
                      '&:before': {
                        content: '"•"',
                        marginRight: 1,
                        color: 'text.disabled'
                      }
                    }}
                  >
                    {cause}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}>
            {onEdit && (
              <IOSButton
                variant="outlined"
                size="small"
                onClick={onEdit}
                sx={{ fontSize: '13px' }}
              >
                Edit Mapping
              </IOSButton>
            )}
            
            {comparison.hasDiscrepancy && onInvestigate && (
              <IOSButton
                variant="filled"
                size="small"
                onClick={onInvestigate}
                sx={{ 
                  fontSize: '13px',
                  backgroundColor: 'warning.main',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'warning.dark'
                  }
                }}
              >
                Investigate
              </IOSButton>
            )}
          </Box>
        </Box>
      </Collapse>
    </IOSCard>
  );
};

export default IOSDetailDisclosure;