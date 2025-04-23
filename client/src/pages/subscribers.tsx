import { useMemo, useState } from 'react';
import { useTable } from '@pankod/refine-core';
import { GridColDef, Box, Paper, Typography, TextField } from '@pankod/refine-mui';
import useDynamicHeight from 'hooks/useDynamicHeight';
import CustomTable from 'components/common/CustomTable';
import DeleteConfirmationDialog from 'components/common/DeleteConfirmationDialog';
import useDeleteWithConfirmation from 'hooks/useDeleteWithConfirmation';
import ErrorDialog from 'components/common/ErrorDialog';
import LoadingDialog from 'components/common/LoadingDialog';
import { CustomThemeProvider } from 'utils/customThemeProvider';
import { Button, ButtonGroup } from '@mui/material';
import { convertToCSV } from 'utils/csvExport';
import { CustomButton } from 'components';

const Subscribers = () => {
  const containerHeight = useDynamicHeight();
  const [timeFilter, setTimeFilter] = useState('all'); // Add this state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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

  const renderDateFilters = () => (
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
  );

  const renderFilterButtons = () => (
    <Box sx={{ p: 1 }}>  {/* Reduced padding */}
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
  );

  const handleExport = () => {
    // Use the filtered rows to create CSV
    const csvContent = convertToCSV(filteredRows);
    
    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', `subscribers_export_${new Date().toISOString().split('T')[0]}.csv`);
    
    // Append link to document
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: GridColDef[] = [
    { field: 'seq', headerName: 'Seq', flex: 0.5, sortable: true }, // Add sequence column
    { field: 'email', headerName: 'Email', flex: 2 },
    { field: 'subscriptionDate', headerName: 'Subscription Date', flex: 1.5 },
  ];

  const rows = filteredRows.map((subscriber) => ({
    id: subscriber._id,
    _id: subscriber._id,
    seq: subscriber.seq, // Add sequence field
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
            xs: '700px',
            sm: '700px',
            md: containerHeight,
            lg: containerHeight,
          },
          display: 'flex',
          flexDirection: 'column',
          m: 2,
          overflow: 'hidden'
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            p: 2,
            fontWeight: 600,
          }}
        >
          {!allSubscribers.length ? 'No Subscribers' : 'All Subscribers'}
        </Typography>

        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between', // This will push items to the edges
          gap: 1, 
          padding: 1, 
        }}>
          <Box sx={{ 
            display: 'flex',
            gap: 5,
            flex: 1, // This will allow the filters to take up available space
          }}>
            {renderFilterButtons()}
            {renderDateFilters()}
            
          </Box>

          <CustomButton 
            title={isExporting ? 'Exporting...' : 'Export'} 
            backgroundColor={'primary.light'} 
            color={'primary.dark'}
            handleClick={handleExport}
            disabled={isExporting || !filteredRows.length}
          />
        </Box>

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
            initialSortModel={[{ field: 'seq', sort: 'desc' }]} // Change sort field to seq
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