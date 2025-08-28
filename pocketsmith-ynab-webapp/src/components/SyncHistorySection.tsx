import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Clear,
  Error,
  CheckCircle,
  Warning,
  Visibility,
  Download,
  Refresh,
} from '@mui/icons-material';
import type { SyncHistoryEntry } from '../services/syncApi';
import { formatTimestamp, formatTableTimestamp, formatTooltipTimestamp, formatDuration } from '../utils/dateUtils';

interface SyncHistorySectionProps {
  syncHistory: SyncHistoryEntry[];
  onRefresh?: () => void;
  loading?: boolean;
}

interface FilterState {
  status: string;
  dateRange: string;
  searchTerm: string;
  hasErrors: boolean | null;
}

const SyncHistorySection: React.FC<SyncHistorySectionProps> = ({
  syncHistory,
  onRefresh,
  loading = false,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: '7d', // Default to last 7 days
    searchTerm: '',
    hasErrors: null,
  });
  const [selectedEntry, setSelectedEntry] = useState<SyncHistoryEntry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      case 'failed':
        return <Error color="error" fontSize="small" />;
      case 'partial':
        return <Warning color="warning" fontSize="small" />;
      default:
        return <Warning color="action" fontSize="small" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };



  // Filter and search logic
  const filteredHistory = useMemo(() => {
    let filtered = [...syncHistory];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    // Error filter
    if (filters.hasErrors === true) {
      filtered = filtered.filter(entry => entry.errorDetails && entry.errorDetails.length > 0);
    } else if (filters.hasErrors === false) {
      filtered = filtered.filter(entry => !entry.errorDetails || entry.errorDetails.length === 0);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateRange) {
        case '1h':
          cutoffDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          cutoffDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoffDate);
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.requestId.toLowerCase().includes(searchLower) ||
        entry.logGroupName.toLowerCase().includes(searchLower) ||
        (entry.errorDetails && entry.errorDetails.some(error => 
          error.toLowerCase().includes(searchLower)
        ))
      );
    }

    return filtered;
  }, [syncHistory, filters]);

  // Pagination
  const paginatedHistory = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredHistory.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHistory, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage);

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'all',
      searchTerm: '',
      hasErrors: null,
    });
    setPage(1);
  };

  const openDetailsDialog = (entry: SyncHistoryEntry) => {
    setSelectedEntry(entry);
    setDetailsDialogOpen(true);
  };

  const closeDetailsDialog = () => {
    setSelectedEntry(null);
    setDetailsDialogOpen(false);
  };

  const exportHistory = () => {
    const csvContent = [
      ['Timestamp', 'Status', 'Request ID', 'Fetched', 'Processed', 'Failed', 'Skipped', 'Duration', 'Errors'].join(','),
      ...filteredHistory.map(entry => [
        entry.timestamp,
        entry.status,
        entry.requestId,
        entry.transactionsFetched,
        entry.transactionsProcessed,
        entry.transactionsFailed,
        entry.duplicatesSkipped,
        entry.duration,
        entry.errorDetails?.join('; ') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6">
                Sync History & Error Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing last 7 days by default
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Export to CSV">
                <IconButton onClick={exportHistory} size="small">
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh history">
                <IconButton onClick={onRefresh} disabled={loading} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filters */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
            <Box flex="1" minWidth="200px">
              <TextField
                fullWidth
                size="small"
                placeholder="Search by request ID, log group, or error..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box minWidth="120px">
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box minWidth="140px">
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Time Range"
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="6h">Last 6 Hours</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box minWidth="120px">
              <FormControl fullWidth size="small">
                <InputLabel>Errors</InputLabel>
                <Select
                  value={filters.hasErrors === null ? 'all' : filters.hasErrors ? 'yes' : 'no'}
                  label="Errors"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('hasErrors', value === 'all' ? null : value === 'yes');
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="yes">With Errors</MenuItem>
                  <MenuItem value="no">No Errors</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Clear />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
              <Typography variant="body2" color="text.secondary">
                {filteredHistory.length} of {syncHistory.length} entries
              </Typography>
            </Box>
          </Box>

          {/* History Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Request ID</TableCell>
                  <TableCell align="right">Fetched</TableCell>
                  <TableCell align="right">Processed</TableCell>
                  <TableCell align="right">Failed</TableCell>
                  <TableCell align="right">Skipped</TableCell>
                  <TableCell align="right">Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary" py={2}>
                        No sync history entries found matching the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistory.map((entry, index) => (
                    <TableRow key={`${entry.requestId}-${index}`} hover>
                      <TableCell>
                        <Tooltip title={formatTooltipTimestamp(entry.timestamp)}>
                          <Typography variant="body2">
                            {formatTableTimestamp(entry.timestamp)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(entry.status)}
                          label={entry.status}
                          size="small"
                          color={getStatusColor(entry.status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {entry.requestId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{entry.transactionsFetched}</TableCell>
                      <TableCell align="right">{entry.transactionsProcessed}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={entry.transactionsFailed > 0 ? "error" : "inherit"}
                        >
                          {entry.transactionsFailed}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{entry.duplicatesSkipped}</TableCell>
                      <TableCell align="right">
                        {entry.duration ? formatDuration(entry.duration) : '-'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View details">
                            <IconButton 
                              size="small" 
                              onClick={() => openDetailsDialog(entry)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {entry.errorDetails && entry.errorDetails.length > 0 && (
                            <Tooltip title={`${entry.errorDetails.length} error(s)`}>
                              <IconButton size="small" color="error">
                                <Error fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={closeDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Sync Operation Details</Typography>
            {selectedEntry && (
              <Chip
                icon={getStatusIcon(selectedEntry.status)}
                label={selectedEntry.status}
                size="small"
                color={getStatusColor(selectedEntry.status) as any}
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              {/* Basic Information */}
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2} mb={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Request ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" gutterBottom>
                    {selectedEntry.requestId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Timestamp
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {formatTimestamp(selectedEntry.timestamp)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Log Group
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedEntry.logGroupName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedEntry.duration ? formatDuration(selectedEntry.duration) : 'Unknown'}
                  </Typography>
                </Box>
              </Box>

              {/* Transaction Statistics */}
              <Typography variant="subtitle1" gutterBottom>
                Transaction Statistics
              </Typography>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mb={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="primary">
                      {selectedEntry.transactionsFetched}
                    </Typography>
                    <Typography variant="caption">Fetched</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="success.main">
                      {selectedEntry.transactionsProcessed}
                    </Typography>
                    <Typography variant="caption">Processed</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="error.main">
                      {selectedEntry.transactionsFailed}
                    </Typography>
                    <Typography variant="caption">Failed</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="warning.main">
                      {selectedEntry.duplicatesSkipped}
                    </Typography>
                    <Typography variant="caption">Skipped</Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Error Details */}
              {selectedEntry.errorDetails && selectedEntry.errorDetails.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Error Details ({selectedEntry.errorDetails.length})
                  </Typography>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      This sync operation encountered {selectedEntry.errorDetails.length} error(s):
                    </Typography>
                  </Alert>
                  {selectedEntry.errorDetails.map((error, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="body2">
                          Error {index + 1}: {error.substring(0, 100)}
                          {error.length > 100 && '...'}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography 
                            variant="body2" 
                            fontFamily="monospace" 
                            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                          >
                            {error}
                          </Typography>
                        </Paper>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {/* No Errors Message */}
              {(!selectedEntry.errorDetails || selectedEntry.errorDetails.length === 0) && (
                <Alert severity="success">
                  <Typography variant="body2">
                    This sync operation completed without any errors.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SyncHistorySection;