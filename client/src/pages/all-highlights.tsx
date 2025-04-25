import { JSXElementConstructor, ReactElement, ReactFragment, useContext, useMemo, useState } from 'react';
import { useTable } from '@pankod/refine-core';
import { 
  GridColDef, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  ButtonGroup, 
  Button,
  useMediaQuery,
  useTheme
} from '@pankod/refine-mui';
import { Add, Close, Settings } from '@mui/icons-material';
import { useNavigate } from '@pankod/refine-react-router-v6';
import CustomButton from 'components/common/CustomButton';
import useDynamicHeight from 'hooks/useDynamicHeight';
import CustomTable from 'components/common/CustomTable';
import DeleteConfirmationDialog from 'components/common/DeleteConfirmationDialog';
import useDeleteWithConfirmation from 'hooks/useDeleteWithConfirmation';
import ErrorDialog from 'components/common/ErrorDialog';
import LoadingDialog from 'components/common/LoadingDialog';
import { Dialog, DialogContent, DialogTitle, IconButton, MenuItem } from '@mui/material';
import CategoryManage from 'components/category/CategoryManage';
import { CustomThemeProvider } from 'utils/customThemeProvider';

const AllHighlights = () => {
  const navigate = useNavigate();
  const containerHeight = useDynamicHeight();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categoryManageOpen, setCategoryManageOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Theme for responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const {
    deleteConfirmation,
    error: deleteError,
    handleTableDelete,
    confirmDelete,
    cancelDelete,
    isLoading: isDeleteLoading,
    closeErrorDialog: closeDeleteErrorDialog,
  } = useDeleteWithConfirmation({
    resource: 'highlights',
    redirectPath: '/highlights',
  });

  const { 
    tableQueryResult: { data, isLoading, isError }
  } = useTable({
    resource: 'highlights',
    hasPagination: false,
  });

  const {
    tableQueryResult: { data: categoryData }
  } = useTable({
    resource: 'categories',
    hasPagination: false,
  });
  
  const categories = categoryData?.data ?? [];
  const allHighlights = data?.data ?? [];

  const filteredRows = useMemo(() => {
    return allHighlights.filter((highlight) => {
      const highlightDate = highlight.date ? new Date(highlight.date) : null;
      const matchesSearch = 
        !searchTerm || 
        highlight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        highlight.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        highlight.seq?.toString().includes(searchTerm);
        
      const matchesDateRange = 
        (!startDate || !highlightDate || highlightDate >= new Date(startDate)) &&
        (!endDate || !highlightDate || highlightDate <= new Date(endDate));

      const matchesStatusFilter = 
        statusFilter === 'all' || 
        highlight.status === statusFilter;

      const matchesCategoryFilter = 
        categoryFilter === 'all' || 
        highlight.category?._id === categoryFilter;

      return matchesSearch && matchesDateRange && matchesStatusFilter && matchesCategoryFilter;
    });
  }, [allHighlights, searchTerm, startDate, endDate, statusFilter, categoryFilter]);

  // Responsive columns configuration for mobile view only
  const getColumns = () => {
    if (isMobile) {
      return [
        { field: 'seq', headerName: 'Seq', flex: 0.5, sortable: true },
        { field: 'title', headerName: 'Title', flex: 2 },
        { 
          field: 'status', 
          headerName: 'Status', 
          flex: 1,
          renderCell: (params: { row: { status: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | null | undefined; }; }) => (
            <Typography
              variant="body2"
              sx={{
                color: 
                  params.row.status === 'published' ? 'success.main' : 
                  params.row.status === 'rejected' ? 'error.main' : 
                  'warning.main',
                fontWeight: 'bold'
              }}
            >
              {params.row.status}
            </Typography>
          )
        }
      ];
    }
    
    // Return the original columns for desktop view
    return [
      { field: 'seq', headerName: 'Seq', flex: 0.5, sortable: true },
      { field: 'title', headerName: 'Title', flex: 2 },
      { field: 'category', headerName: 'Category', flex: 1 },
      { field: 'sdg', headerName: 'SDG', flex: 1 },
      { field: 'date', headerName: 'Date', flex: 1 },
      { field: 'location', headerName: 'Location', flex: 1 },
      { 
        field: 'status', 
        headerName: 'Status', 
        flex: 1,
        renderCell: (params: { row: { status: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | null | undefined; }; }) => (
          <Typography
            variant="body2"
            sx={{
              color: 
                params.row.status === 'published' ? 'success.main' : 
                params.row.status === 'rejected' ? 'error.main' : 
                'warning.main',
              fontWeight: 'bold'
            }}
          >
            {params.row.status}
          </Typography>
        )
      },
      { field: 'createdAt', headerName: 'Created At', flex: 1 },
    ];
  };

  const columns = getColumns();

  const handleView = (id: string) => {
    navigate(`/highlights/show/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/highlights/edit/${id}`);
  };

  const rows = filteredRows.map((highlight) => ({
    id: highlight._id,
    _id: highlight._id,
    seq: highlight.seq,
    title: highlight.title,
    category: highlight.category?.category || '',
    sdg: Array.isArray(highlight.sdg) ? highlight.sdg.join(', ') : highlight.sdg,
    date: highlight.date ? new Date(highlight.date).toLocaleDateString() : '',
    location: highlight.location || '',
    status: highlight.status || 'draft',
    createdAt: highlight.createdAt ? new Date(highlight.createdAt).toLocaleDateString() : '',
  }));

  if (isLoading) {
    return (
      <LoadingDialog 
        open={isLoading}
        loadingMessage="Loading highlights data..."
      />
    );
  }

  if (isError) {
    return (
      <ErrorDialog 
        open={true}
        errorMessage="Error loading highlights data"
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
          {!allHighlights.length ? 'No Highlights Records' : 'All Highlights'}
        </Typography>
        
        {/* Mobile filter layout */}
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
                color="white"
                icon={<Add />}
                handleClick={() => navigate(`/highlights/create`)}
              />
            </Box>
            
            {/* Compact Status Filter Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
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
                  variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setStatusFilter('all')}
                  sx={{
                    backgroundColor: statusFilter === 'all' ? '#005099' : 'inherit',
                    color: statusFilter === 'all' ? 'primary.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'contained' : 'outlined'}
                  onClick={() => setStatusFilter('draft')}
                  sx={{
                    backgroundColor: statusFilter === 'draft' ? 'warning.light' : 'inherit',
                    color: statusFilter === 'draft' ? 'warning.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  Draft
                </Button>
                <Button
                  variant={statusFilter === 'published' ? 'contained' : 'outlined'}
                  onClick={() => setStatusFilter('published')}
                  sx={{
                    backgroundColor: statusFilter === 'published' ? 'success.light' : 'inherit',
                    color: statusFilter === 'published' ? 'success.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  Pub
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'contained' : 'outlined'}
                  onClick={() => setStatusFilter('rejected')}
                  sx={{
                    backgroundColor: statusFilter === 'rejected' ? 'error.light' : 'inherit',
                    color: statusFilter === 'rejected' ? 'error.contrastText' : 'inherit',
                    flex: 1
                  }}
                >
                  Rej
                </Button>
              </ButtonGroup>
            </Box>
            
            {/* Last row with date filters and category */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <TextField
                select
                size="small"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                InputProps={{ 
                  sx: { 
                    height: '32px',
                    fontSize: '0.75rem'
                  }
                }}
                sx={{ 
                  flex: 1,
                  '& .MuiSelect-select': {
                    padding: '4px 8px'
                  }
                }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.category}
                  </MenuItem>
                ))}
              </TextField>
              
              <IconButton
                size="small"
                onClick={() => setCategoryManageOpen(true)}
                sx={{ padding: '4px' }}
              >
                <Settings fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                sx={{ padding: '4px' }}
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
            gap: 1.5,
            padding: 1.5,
          }}>
            {/* Search and Date Filter Grid */}
            <Box 
              sx={{
                display: 'grid',
                gridTemplateColumns: '2fr 3fr auto',
                gap: 1,
              }}
            >
              {/* Search Box */}
              <Box sx={{ p: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Search by title, location, or sequence"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>

              {/* Date Range */}
              <Box 
                sx={{ 
                  p: 1,
                  display: 'flex',
                  gap: 1,
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
              <Box sx={{ p: 1 }}>
                <CustomButton
                  title="Add"
                  backgroundColor="#005099"
                  color="white"
                  icon={<Add />}
                  handleClick={() => navigate(`/highlights/create`)}
                />
              </Box>
            </Box>

            {/* Status and Category Filter Grid */}
            <Box 
              sx={{
                display: 'grid',
                gridTemplateColumns: '3fr 2fr',
                gap: 1,
              }}
            >
              {/* Status Filter */}
              <Box sx={{ p: 1 }}>
                <ButtonGroup fullWidth size="small" color="primary" >
                  <Button
                    variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setStatusFilter('all')}
                    sx={{
                      backgroundColor: statusFilter === 'all' ? '#005099' : 'inherit',
                      color: statusFilter === 'all' ? 'primary.contrastText' : 'inherit',
                    }}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'draft' ? 'contained' : 'outlined'}
                    onClick={() => setStatusFilter('draft')}
                    sx={{
                      backgroundColor: statusFilter === 'draft' ? 'warning.light' : 'inherit',
                      color: statusFilter === 'draft' ? 'warning.contrastText' : 'inherit',
                    }}
                  >
                    Draft
                  </Button>
                  <Button
                    variant={statusFilter === 'published' ? 'contained' : 'outlined'}
                    onClick={() => setStatusFilter('published')}
                    sx={{
                      backgroundColor: statusFilter === 'published' ? 'success.light' : 'inherit',
                      color: statusFilter === 'published' ? 'success.contrastText' : 'inherit',
                    }}
                  >
                    Published
                  </Button>
                  <Button
                    variant={statusFilter === 'rejected' ? 'contained' : 'outlined'}
                    onClick={() => setStatusFilter('rejected')}
                    sx={{
                      backgroundColor: statusFilter === 'rejected' ? 'error.light' : 'inherit',
                      color: statusFilter === 'rejected' ? 'error.contrastText' : 'inherit',
                    }}
                  >
                    Rejected
                  </Button>
                </ButtonGroup>
              </Box>

              {/* Category Filter */}
              <Box 
                sx={{ 
                  p: 1,
                  display: 'flex',
                  gap: 0.5,
                }}
              >
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Category Filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.category}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  size="small"
                  onClick={() => setCategoryManageOpen(true)}
                >
                  <Settings fontSize="small" />
                </IconButton>
              </Box>
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

        {/* Category Dialog - with better positioning on mobile */}
        <Dialog
          open={categoryManageOpen}
          onClose={() => setCategoryManageOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            Manage Categories
            <IconButton
              aria-label="close"
              onClick={() => setCategoryManageOpen(false)}
              sx={{ 
                position: 'absolute',
                right: 8,
                top: 8
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <CategoryManage />
          </DialogContent>
        </Dialog>
      </Paper>
    </CustomThemeProvider>
  );
};

export default AllHighlights;