import { useMemo, useState } from 'react';
import { useTable } from '@pankod/refine-core';
import { 
  GridColDef, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button,
  useMediaQuery,
  useTheme
} from '@pankod/refine-mui';
import { Add, Close } from '@mui/icons-material';
import { useNavigate } from '@pankod/refine-react-router-v6';
import CustomButton from 'components/common/CustomButton';
import useDynamicHeight from 'hooks/useDynamicHeight';
import CustomTable from 'components/common/CustomTable';
import DeleteConfirmationDialog from 'components/common/DeleteConfirmationDialog';
import useDeleteWithConfirmation from 'hooks/useDeleteWithConfirmation';
import ErrorDialog from 'components/common/ErrorDialog';
import LoadingDialog from 'components/common/LoadingDialog';
import { CustomThemeProvider } from 'utils/customThemeProvider';
import { IconButton } from '@mui/material';

const AllPressReleases = () => {
  const navigate = useNavigate();
  const containerHeight = useDynamicHeight();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Theme for responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    deleteConfirmation,
    error: deleteError,
    handleTableDelete,
    confirmDelete,
    cancelDelete,
    isLoading: isDeleteLoading,
    closeErrorDialog: closeDeleteErrorDialog,
  } = useDeleteWithConfirmation({
    resource: 'press-release',
    redirectPath: '/press-release',
  });

  const { 
    tableQueryResult: { data, isLoading, isError }
  } = useTable({
    resource: 'press-release',
    hasPagination: false,
  });

  const allPressReleases = data?.data ?? [];

  const filteredRows = useMemo(() => {
    return allPressReleases.filter((pressRelease) => {
      const pressReleaseDate = pressRelease.date ? new Date(pressRelease.date) : null;
      const matchesSearch = 
        !searchTerm || 
        pressRelease.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pressRelease.publisher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pressRelease.seq?.toString().includes(searchTerm);
        
      const matchesDateRange = 
        (!startDate || !pressReleaseDate || pressReleaseDate >= new Date(startDate)) &&
        (!endDate || !pressReleaseDate || pressReleaseDate <= new Date(endDate));

      return matchesSearch && matchesDateRange;
    });
  }, [allPressReleases, searchTerm, startDate, endDate]);

  // Responsive columns configuration
  const getColumns = () => {
    if (isMobile) {
      return [
        { field: 'seq', headerName: 'Seq', flex: 0.5, sortable: true },
        { field: 'title', headerName: 'Title', flex: 2 },
        { 
          field: 'date', 
          headerName: 'Date', 
          flex: 1,
          renderCell: (params: { row: { date: string | number | Date; }; }) => (
            <Typography variant="body2">
              {params.row.date ? new Date(params.row.date).toLocaleDateString() : ''}
            </Typography>
          )
        }
      ];
    }
    
    // Return all columns for desktop view
    return [
      { field: 'seq', headerName: 'Seq', flex: 0.5, sortable: true },
      { field: 'title', headerName: 'Title', flex: 2 },
      { field: 'publisher', headerName: 'Publisher', flex: 1 },
      { 
        field: 'date', 
        headerName: 'Date', 
        flex: 1,
        renderCell: (params: { row: { date: string | number | Date; }; }) => (
          <Typography variant="body2">
            {params.row.date ? new Date(params.row.date).toLocaleDateString() : ''}
          </Typography>
        )
      },
      { 
        field: 'createdAt', 
        headerName: 'Created At', 
        flex: 1,
        renderCell: (params: { row: { createdAt: string | number | Date; }; }) => (
          <Typography variant="body2">
            {params.row.createdAt ? new Date(params.row.createdAt).toLocaleDateString() : ''}
          </Typography>
        )
      },
    ];
  };

  const columns = getColumns();

  const handleView = (id: string) => {
    navigate(`/press-release/show/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/press-release/edit/${id}`);
  };

  const rows = filteredRows.map((pressRelease) => ({
    id: pressRelease._id,
    _id: pressRelease._id,
    seq: pressRelease.seq,
    title: pressRelease.title,
    publisher: pressRelease.publisher || '',
    date: pressRelease.date,
    createdAt: pressRelease.createdAt,
  }));

  if (isLoading) {
    return (
      <LoadingDialog 
        open={isLoading}
        loadingMessage="Loading press releases data..."
      />
    );
  }

  if (isError) {
    return (
      <ErrorDialog 
        open={true}
        errorMessage="Error loading press releases data"
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
          {!allPressReleases.length ? 'No Press Releases' : 'All Press Releases'}
        </Typography>
        
        {/* Mobile layout */}
        {isMobile ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 0.5,
            padding: 0.5,
          }}>
            {/* Top row with search and add button */}
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5, 
              alignItems: 'center'
            }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ 
                  sx: { 
                    height: '32px',
                    fontSize: '0.875rem'
                  }
                }}
                sx={{ flex: 1 }}
              />
              <CustomButton
                title=""
                backgroundColor="#005099"
                color="#ffffff"
                icon={<Add />}
                handleClick={() => navigate(`/press-release/create`)}

              />
              
              <IconButton
                size="small"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                sx={{ 
                  padding: '4px',
                  height: '32px',
                  width: '32px'
                }}
              >
                {filtersExpanded ? <Close fontSize="small" /> : <Add fontSize="small" />}
              </IconButton>
            </Box>
            
            {/* Expandable date filters */}
            {filtersExpanded && (
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                <TextField
                  size="small"
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputProps={{ 
                    sx: { 
                      height: '32px',
                      fontSize: '0.75rem'
                    }
                  }}
                  sx={{ flex: 1 }}
                />
              </Box>
            )}
          </Box>
        ) : (
          // Original desktop layout
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            padding: 2,
          }}>
            {/* Search and Date Filter Grid */}
            <Box 
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 3fr auto' },
                gap: 2,
              }}
            >
              {/* Search Box */}
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Search by title, publisher, or sequence"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>

              {/* Date Range */}
              <Box 
                sx={{ 
                  display: 'flex',
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* Add Button */}
              <CustomButton
                title="Add"
                backgroundColor="#005099"
                color="#ffffff"
                icon={<Add />}
                handleClick={() => navigate(`/press-release/create`)}
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
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(ids) => handleTableDelete(ids, rows)}
            initialSortModel={[{ field: 'date', sort: 'desc' }]}
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

export default AllPressReleases;