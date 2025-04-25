import { useMemo, useState } from 'react';
import { useTable } from '@pankod/refine-core';
import { 
  GridColDef, 
  Box, 
  Paper, 
  Typography, 
  TextField,
  useMediaQuery,
  useTheme
} from '@pankod/refine-mui';
import useDynamicHeight from 'hooks/useDynamicHeight';
import CustomTable from 'components/common/CustomTable';
import DeleteConfirmationDialog from 'components/common/DeleteConfirmationDialog';
import useDeleteWithConfirmation from 'hooks/useDeleteWithConfirmation';
import ErrorDialog from 'components/common/ErrorDialog';
import LoadingDialog from 'components/common/LoadingDialog';
import { CustomThemeProvider } from 'utils/customThemeProvider';
import { Button, ButtonGroup, IconButton, Collapse } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { CustomButton } from 'components';

const Subscribers = () => {
  const containerHeight = useDynamicHeight();
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Theme for responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const handleResetFilters = () => {
    setTimeFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const {
    deleteConfirmation,
    error: deleteError,
    handleTableDelete,
    confirmDelete,
    cancelDelete,
    isLoading: isDeleteLoading,
    closeErrorDialog: closeDeleteErrorDialog,
  } = useDeleteWithConfirmation({
    resource: 'subscribers',
    redirectPath: '/subscribers',
  });

  const { 
    tableQueryResult: { data, isLoading, isError }
  } = useTable({
    resource: 'subscribers',
    hasPagination: false,
  });

  const allSubscribers = data?.data ?? [];

  const filteredRows = useMemo(() => {
    return allSubscribers.filter((subscriber) => {
      const subscriberDate = new Date(subscriber.createdAt);
      const today = new Date();

      // Date range filter
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // Include the entire end date
        return subscriberDate >= start && subscriberDate <= end;
      }
      
      // Time period filter
      switch (timeFilter) {
        case 'day':
          return subscriberDate.toDateString() === today.toDateString();
        case 'week':
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return subscriberDate >= lastWeek;
        case 'month':
          return subscriberDate.getMonth() === today.getMonth() && 
                subscriberDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    });
  }, [allSubscribers, timeFilter, startDate, endDate]);

  const getExportFilename = () => {
    if (startDate && endDate) {
      return `subscribers_${startDate}_to_${endDate}.csv`;
    }
    
    switch (timeFilter) {
      case 'day':
        return `subscribers_today.csv`;
      case 'week':
        return `subscribers_thisweek.csv`;
      case 'month':
        return `subscribers_thismonth.csv`;
      default:
        return `subscribers_all_${new Date().toISOString().split('T')[0]}.csv`;
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Create CSV with filtered data
      const csvData = filteredRows.map(subscriber => ({
        Sequence: subscriber.seq,
        Email: subscriber.email,
        'Subscription Date': new Date(subscriber.createdAt).toLocaleDateString()
      }));
      
      // Convert to CSV string
      const csvContent = [
        Object.keys(csvData[0]).join(','), // Headers
        ...csvData.map(row => Object.values(row).join(',')) // Data rows
      ].join('\n');
  
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      // Add filter info to filename
      const filename = getExportFilename();
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Responsive columns configuration for mobile vs desktop
  const getColumns = () => {
    if (isMobile) {
      return [
        { field: 'seq', headerName: 'Seq', flex: 0.5, sortable: true },
        { field: 'email', headerName: 'Email', flex: 2 }
      ];
    }
    
    // Return the original columns for desktop view
    return [
      { field: 'seq', headerName: 'Seq', flex: 0.5, sortable: true },
      { field: 'email', headerName: 'Email', flex: 2 },
      { field: 'subscriptionDate', headerName: 'Subscription Date', flex: 1.5 },
    ];
  };

  const columns = getColumns();

  const rows = filteredRows.map((subscriber) => ({
    id: subscriber._id,
    _id: subscriber._id,
    seq: subscriber.seq,
    email: subscriber.email,
    subscriptionDate: subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleDateString() : 'N/A',
  }));

  if (isLoading) {
    return (
      <LoadingDialog 
        open={isLoading}
        loadingMessage="Loading subscribers data..."
      />
    );
  }

  if (isError) {
    return (
      <ErrorDialog 
        open={true}
        errorMessage="Error loading subscribers data"
      />
    );
  }

  return (
    <CustomThemeProvider>
      <Paper 
        elevation={3} 
        sx={{ 
          height: {
            xs: '100vh', // Full height on mobile
            sm: '700px',
            md: containerHeight,
            lg: containerHeight,
          },
          width: '100%', // Full width container
          maxWidth: {
            xs: '100%', // Full width on mobile
            sm: '100%', // Full width on tablet
            md: '100%', // Full width on desktop
          },
          display: 'flex',
          flexDirection: 'column',
          m: { xs: 0, sm: 2 }, // No margin on mobile
          overflow: 'hidden'
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            p: { xs: 1, sm: 2 },
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '2rem' } // Smaller font on mobile
          }}
        >
          {!allSubscribers.length ? 'No Subscribers' : 'All Subscribers'}
        </Typography>
        
        {/* Mobile filter layout */}
        {isMobile ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5,
            padding: 0.5,
          }}>
            {/* Top row with time filter buttons */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <ButtonGroup 
                size="small" 
                variant="text"
                sx={{ 
                  width: '100%',
                  '& .MuiButton-root': {
                    padding: '2px 4px',
                    fontSize: '0.7rem',
                    minWidth: 0
                  }
                }}
              >
                <Button
                  variant={timeFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setTimeFilter('all')}
                  sx={{
                    backgroundColor: timeFilter === 'all' ? '#005099' : 'inherit',
                    color: timeFilter === 'all' ? 'primary.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  All
                </Button>
                <Button
                  variant={timeFilter === 'day' ? 'contained' : 'outlined'}
                  onClick={() => setTimeFilter('day')}
                  sx={{
                    backgroundColor: timeFilter === 'day' ? '#005099' : 'inherit',
                    color: timeFilter === 'day' ? 'primary.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  Today
                </Button>
                <Button
                  variant={timeFilter === 'week' ? 'contained' : 'outlined'}
                  onClick={() => setTimeFilter('week')}
                  sx={{
                    backgroundColor: timeFilter === 'week' ? '#005099' : 'inherit',
                    color: timeFilter === 'week' ? 'primary.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  Week
                </Button>
                <Button
                  variant={timeFilter === 'month' ? 'contained' : 'outlined'}
                  onClick={() => setTimeFilter('month')}
                  sx={{
                    backgroundColor: timeFilter === 'month' ? '#005099' : 'inherit',
                    color: timeFilter === 'month' ? 'primary.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  Month
                </Button>
              </ButtonGroup>
            </Box>
            
            {/* Second row with date toggle and export */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                startIcon={filtersExpanded ? <Close fontSize="small" /> : <Add fontSize="small" />}
                sx={{ 
                  fontSize: '0.7rem',
                  flex: 1
                }}
              >
                {filtersExpanded ? 'Hide Dates' : 'Date Range'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleResetFilters}
                disabled={timeFilter === 'all' && !startDate && !endDate}
                sx={{ 
                  fontSize: '0.7rem',
                  flex: 1
                }}
              >
                Reset
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={handleExport}
                disabled={isExporting || !filteredRows.length}
                sx={{ 
                  fontSize: '0.7rem',
                  flex: 1
                }}
              >
                {isExporting ? '...' : 'Export'}
              </Button>
            </Box>
            
            {/* Expandable date filter section */}
            <Collapse in={filtersExpanded}>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                <TextField
                  size="small"
                  type="date"
                  label="Start"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setTimeFilter('all');
                  }}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ 
                    sx: { 
                      height: '32px',
                      fontSize: '0.75rem'
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="End"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setTimeFilter('all');
                  }}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ 
                    sx: { 
                      height: '32px',
                      fontSize: '0.75rem'
                    }
                  }}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Collapse>
          </Box>
        ) : (
          // Original desktop layout
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1, 
            padding: 1, 
          }}>
            <Box sx={{ 
              display: 'flex',
              gap: 2,
              alignItems: 'center',
            }}>
              <Box sx={{ p: 1 }}>
                <ButtonGroup fullWidth size="small" color="primary">
                  <Button 
                    onClick={() => setTimeFilter('all')}
                    variant={timeFilter === 'all' ? 'contained' : 'outlined'}
                  >
                    All Time
                  </Button>
                  <Button 
                    onClick={() => setTimeFilter('day')}
                    variant={timeFilter === 'day' ? 'contained' : 'outlined'}
                  >
                    Today
                  </Button>
                  <Button 
                    onClick={() => setTimeFilter('week')}
                    variant={timeFilter === 'week' ? 'contained' : 'outlined'}
                  >
                    This Week
                  </Button>
                  <Button 
                    onClick={() => setTimeFilter('month')}
                    variant={timeFilter === 'month' ? 'contained' : 'outlined'}
                  >
                    This Month
                  </Button>
                </ButtonGroup>
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                gap: 2,
                alignItems: 'center'
              }}>
                <TextField
                  type="date"
                  color='primary'
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setTimeFilter('all'); // Reset time filter when using date range
                  }}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                <TextField
                  type="date"
                  color='primary'
                  label="End Date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setTimeFilter('all'); // Reset time filter when using date range
                  }}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Box>
              
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleResetFilters}
                disabled={timeFilter === 'all' && !startDate && !endDate}
                sx={{ height: 40 }} 
              >
                Reset
              </Button>
            </Box>

            {/* Keep the export button on the right */}
            <Box sx={{ marginLeft: 'auto' }}> 
              <CustomButton 
                title={isExporting ? 'Exporting...' : 'Export'} 
                backgroundColor={'primary.light'} 
                color={'primary.dark'}
                handleClick={handleExport}
                disabled={isExporting || !filteredRows.length}
              />
            </Box>
          </Box>
        )}
        
        {/* Table Container */}
        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden'
        }}>
          <CustomTable
            rows={rows}
            columns={columns}
            containerHeight="100%"
            onDelete={(ids) => handleTableDelete(ids, rows)}
            initialSortModel={[{ field: 'seq', sort: 'desc' }]}
          />
        </Box>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteConfirmation.open}
          contentText={deleteConfirmation.seq}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
        
        {/* Loading Dialog */}
        <LoadingDialog 
          open={isDeleteLoading} 
          loadingMessage="Please wait..." 
        />

        {/* Error Dialog */}
        <ErrorDialog
          open={deleteError.open}
          errorMessage={deleteError.message}
          onClose={closeDeleteErrorDialog}
        />
      </Paper>
    </CustomThemeProvider>
  );
};

export default Subscribers;