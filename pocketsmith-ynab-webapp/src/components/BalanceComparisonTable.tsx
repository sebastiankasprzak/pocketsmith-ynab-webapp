import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  Typography,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import type { BalanceComparison } from '../types/accounts';

interface BalanceComparisonTableProps {
  comparisons: BalanceComparison[];
  loading?: boolean;
}

type SortField = 'accountName' | 'pocketsmithBalance' | 'ynabBalance' | 'difference' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'discrepancies' | 'matching';

export const BalanceComparisonTable: React.FC<BalanceComparisonTableProps> = ({
  comparisons,
  loading = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [sortField, setSortField] = useState<SortField>('accountName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Format currency values
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

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort comparisons
  const filteredAndSortedComparisons = useMemo(() => {
    // Ensure comparisons is an array before filtering
    if (!comparisons || !Array.isArray(comparisons)) {
      return [];
    }

    let filtered = comparisons.filter(comparison => {
      // Search filter - handle undefined account names
      const psAccountName = comparison.pocketsmithAccountName || '';
      const ynabAccountName = comparison.ynabAccountName || '';
      const searchMatch = searchTerm === '' ||
        psAccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ynabAccountName.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const typeMatch = filterType === 'all' ||
        (filterType === 'discrepancies' && comparison.hasDiscrepancy) ||
        (filterType === 'matching' && !comparison.hasDiscrepancy);

      return searchMatch && typeMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'accountName':
          aValue = (a.pocketsmithAccountName || '').toLowerCase();
          bValue = (b.pocketsmithAccountName || '').toLowerCase();
          break;
        case 'pocketsmithBalance':
          aValue = a.pocketsmithBalance;
          bValue = b.pocketsmithBalance;
          break;
        case 'ynabBalance':
          aValue = a.ynabBalance;
          bValue = b.ynabBalance;
          break;
        case 'difference':
          aValue = Math.abs(a.difference);
          bValue = Math.abs(b.difference);
          break;
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [comparisons, searchTerm, filterType, sortField, sortDirection]);

  // Get discrepancy statistics
  const stats = useMemo(() => {
    // Ensure comparisons is an array before processing
    if (!comparisons || !Array.isArray(comparisons)) {
      return {
        totalAccounts: 0,
        discrepancies: 0,
        matching: 0,
        totalDiscrepancyAmount: 0
      };
    }

    const totalAccounts = comparisons.length;
    const discrepancies = comparisons.filter(c => c.hasDiscrepancy).length;
    const totalDiscrepancyAmount = comparisons
      .filter(c => c.hasDiscrepancy)
      .reduce((sum, c) => sum + Math.abs(c.difference), 0);

    return {
      totalAccounts,
      discrepancies,
      matching: totalAccounts - discrepancies,
      totalDiscrepancyAmount
    };
  }, [comparisons]);

  // Render discrepancy indicator
  const renderDiscrepancyIndicator = (comparison: BalanceComparison) => {
    if (!comparison.hasDiscrepancy) {
      return (
        <Tooltip title="Balances match">
          <CheckCircleIcon color="success" fontSize="small" />
        </Tooltip>
      );
    }

    const isPositive = comparison.difference > 0;
    return (
      <Tooltip title={`Discrepancy: ${formatCurrency(Math.abs(comparison.difference), comparison.currency)}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WarningIcon color="warning" fontSize="small" />
          {isPositive ? (
            <TrendingUpIcon color="error" fontSize="small" />
          ) : (
            <TrendingDownIcon color="primary" fontSize="small" />
          )}
        </Box>
      </Tooltip>
    );
  };

  // Mobile card view
  const renderMobileCard = (comparison: BalanceComparison) => (
    <Card
      key={`${comparison.pocketsmithAccountId}-${comparison.ynabAccountId}`}
      sx={{
        mb: 2,
        border: comparison.hasDiscrepancy ? `2px solid ${theme.palette.warning.main}` : undefined,
        backgroundColor: comparison.hasDiscrepancy ? theme.palette.warning.light + '10' : undefined
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceIcon fontSize="small" />
              {comparison.pocketsmithAccountName || 'Unknown Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              → {comparison.ynabAccountName || 'Unknown Account'}
            </Typography>
          </Box>
          {renderDiscrepancyIndicator(comparison)}
        </Box>

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">PocketSmith:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(comparison.pocketsmithBalance, comparison.currency)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">YNAB:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(comparison.ynabBalance, comparison.currency)}
            </Typography>
          </Box>

          {comparison.hasDiscrepancy && (
            <>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="warning.main" fontWeight="medium">
                  Difference:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={comparison.difference > 0 ? 'error.main' : 'primary.main'}
                >
                  {comparison.difference > 0 ? '+' : ''}
                  {formatCurrency(comparison.difference, comparison.currency)}
                </Typography>
              </Box>
            </>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Updated: {formatRelativeTime(comparison.lastUpdated)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading balance comparisons...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Statistics Summary */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<AccountBalanceIcon />}
          label={`${stats.totalAccounts} Accounts`}
          variant="outlined"
        />
        <Chip
          icon={<CheckCircleIcon />}
          label={`${stats.matching} Matching`}
          color="success"
          variant={stats.matching > 0 ? "filled" : "outlined"}
        />
        <Chip
          icon={<WarningIcon />}
          label={`${stats.discrepancies} Discrepancies`}
          color="warning"
          variant={stats.discrepancies > 0 ? "filled" : "outlined"}
        />
        {stats.discrepancies > 0 && (
          <Chip
            label={`Total: ${formatCurrency(stats.totalDiscrepancyAmount)}`}
            color="error"
            variant="outlined"
          />
        )}
      </Box>

      {/* Filters and Search */}
      <Box
        sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}
        role="search"
        aria-label="Balance comparison filters"
      >
        <TextField
          size="small"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search account names"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon aria-hidden="true" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="filter-type-label">Filter</InputLabel>
          <Select
            value={filterType}
            label="Filter"
            labelId="filter-type-label"
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            aria-label="Filter balance comparisons by type"
          >
            <MenuItem value="all">All Accounts</MenuItem>
            <MenuItem value="discrepancies">Discrepancies Only</MenuItem>
            <MenuItem value="matching">Matching Only</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Results */}
      {filteredAndSortedComparisons.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No balance comparisons found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No account mappings are configured for balance comparison'
            }
          </Typography>
        </Box>
      ) : (
        <>
          {isMobile ? (
            // Mobile card view
            <Box>
              {filteredAndSortedComparisons.map(renderMobileCard)}
            </Box>
          ) : (
            // Desktop table view
            <TableContainer
              component={Paper}
              role="region"
              aria-label="Balance comparison table"
            >
              <Table aria-label="Balance comparisons between PocketSmith and YNAB accounts">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'accountName'}
                        direction={sortField === 'accountName' ? sortDirection : 'asc'}
                        onClick={() => handleSort('accountName')}
                        aria-label={`Sort by account name ${sortField === 'accountName' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      >
                        Account
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'pocketsmithBalance'}
                        direction={sortField === 'pocketsmithBalance' ? sortDirection : 'asc'}
                        onClick={() => handleSort('pocketsmithBalance')}
                        aria-label={`Sort by PocketSmith balance ${sortField === 'pocketsmithBalance' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      >
                        PocketSmith Balance
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'ynabBalance'}
                        direction={sortField === 'ynabBalance' ? sortDirection : 'asc'}
                        onClick={() => handleSort('ynabBalance')}
                        aria-label={`Sort by YNAB balance ${sortField === 'ynabBalance' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      >
                        YNAB Balance
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'difference'}
                        direction={sortField === 'difference' ? sortDirection : 'asc'}
                        onClick={() => handleSort('difference')}
                        aria-label={`Sort by balance difference ${sortField === 'difference' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      >
                        Difference
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'lastUpdated'}
                        direction={sortField === 'lastUpdated' ? sortDirection : 'asc'}
                        onClick={() => handleSort('lastUpdated')}
                        aria-label={`Sort by last updated ${sortField === 'lastUpdated' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      >
                        Last Updated
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedComparisons.map((comparison) => (
                    <TableRow
                      key={`${comparison.pocketsmithAccountId}-${comparison.ynabAccountId}`}
                      sx={{
                        backgroundColor: comparison.hasDiscrepancy
                          ? theme.palette.warning.light + '10'
                          : undefined,
                        '&:hover': {
                          backgroundColor: comparison.hasDiscrepancy
                            ? theme.palette.warning.light + '20'
                            : theme.palette.action.hover
                        }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {comparison.pocketsmithAccountName || 'Unknown Account'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            → {comparison.ynabAccountName || 'Unknown Account'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontFamily="monospace">
                          {formatCurrency(comparison.pocketsmithBalance, comparison.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontFamily="monospace">
                          {formatCurrency(comparison.ynabBalance, comparison.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {comparison.hasDiscrepancy ? (
                          <Typography
                            variant="body2"
                            fontFamily="monospace"
                            fontWeight="bold"
                            color={comparison.difference > 0 ? 'error.main' : 'primary.main'}
                          >
                            {comparison.difference > 0 ? '+' : ''}
                            {formatCurrency(comparison.difference, comparison.currency)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {renderDiscrepancyIndicator(comparison)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(comparison.lastUpdated)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};