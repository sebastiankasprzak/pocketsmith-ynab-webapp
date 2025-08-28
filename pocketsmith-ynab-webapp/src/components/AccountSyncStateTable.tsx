import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  Box,
  Tooltip,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Search,
  CheckCircle,
  Schedule,
  Error,
} from '@mui/icons-material';
import type { SyncStateAccount } from '../services/syncApi';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface AccountSyncStateTableProps {
  accounts: SyncStateAccount[];
  loading?: boolean;
}

type SortField = 'account_id' | 'last_sync' | 'processed_transactions_count' | 'last_updated';
type SortDirection = 'asc' | 'desc';

export const AccountSyncStateTable: React.FC<AccountSyncStateTableProps> = ({
  accounts,
  loading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('last_updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedRows(newExpanded);
  };

  const getSyncStatus = (account: SyncStateAccount) => {
    if (!account.last_sync) {
      return { color: 'default' as const, icon: <Error />, text: 'Never synced' };
    }

    const lastSync = parseISO(account.last_sync);
    const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursAgo < 1) {
      return { color: 'success' as const, icon: <CheckCircle />, text: 'Recently synced' };
    } else if (hoursAgo < 24) {
      return { color: 'warning' as const, icon: <Schedule />, text: 'Synced today' };
    } else {
      return { color: 'error' as const, icon: <Error />, text: 'Sync overdue' };
    }
  };

  const filteredAndSortedAccounts = accounts
    .filter(account => 
      account.account_id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'account_id':
          aValue = a.account_id;
          bValue = b.account_id;
          break;
        case 'last_sync':
          aValue = a.last_sync ? parseISO(a.last_sync).getTime() : 0;
          bValue = b.last_sync ? parseISO(b.last_sync).getTime() : 0;
          break;
        case 'processed_transactions_count':
          aValue = a.processed_transactions_count;
          bValue = b.processed_transactions_count;
          break;
        case 'last_updated':
          aValue = parseISO(a.last_updated).getTime();
          bValue = parseISO(b.last_updated).getTime();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Account Sync Details
          </Typography>
          <TextField
            size="small"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'account_id'}
                    direction={sortField === 'account_id' ? sortDirection : 'asc'}
                    onClick={() => handleSort('account_id')}
                  >
                    Account ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'last_sync'}
                    direction={sortField === 'last_sync' ? sortDirection : 'asc'}
                    onClick={() => handleSort('last_sync')}
                  >
                    Last Sync
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'processed_transactions_count'}
                    direction={sortField === 'processed_transactions_count' ? sortDirection : 'asc'}
                    onClick={() => handleSort('processed_transactions_count')}
                  >
                    Transactions
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'last_updated'}
                    direction={sortField === 'last_updated' ? sortDirection : 'asc'}
                    onClick={() => handleSort('last_updated')}
                  >
                    Last Updated
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedAccounts.map((account) => {
                const syncStatus = getSyncStatus(account);
                const isExpanded = expandedRows.has(account.account_id);

                return (
                  <React.Fragment key={account.account_id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpansion(account.account_id)}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {account.account_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={syncStatus.text}>
                          <Chip
                            icon={syncStatus.icon}
                            label={syncStatus.text}
                            color={syncStatus.color}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {account.last_sync ? (
                          <Tooltip title={format(parseISO(account.last_sync), 'PPpp')}>
                            <Typography variant="body2">
                              {formatDistanceToNow(parseISO(account.last_sync))} ago
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Never
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {account.processed_transactions_count.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={format(parseISO(account.last_updated), 'PPpp')}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDistanceToNow(parseISO(account.last_updated))} ago
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Account Details
                            </Typography>
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Account ID
                                </Typography>
                                <Typography variant="body2">
                                  {account.account_id}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Transaction Count
                                </Typography>
                                <Typography variant="body2">
                                  {account.processed_transactions_count.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Last Sync Time
                                </Typography>
                                <Typography variant="body2">
                                  {account.last_sync ? format(parseISO(account.last_sync), 'PPpp') : 'Never'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Last Updated
                                </Typography>
                                <Typography variant="body2">
                                  {format(parseISO(account.last_updated), 'PPpp')}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredAndSortedAccounts.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No accounts match your search.' : 'No account data available.'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountSyncStateTable;