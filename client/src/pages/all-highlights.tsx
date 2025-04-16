import { useMemo, useState } from 'react';
import { useTable } from '@pankod/refine-core';
import { GridColDef, Box, Paper, Typography, Stack, TextField, ButtonGroup, Button } from '@pankod/refine-mui';
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

const AllHighlights = () => {
  const navigate = useNavigate();
  const containerHeight = useDynamicHeight();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categoryManageOpen, setCategoryManageOpen] = useState(false);


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

  const columns: GridColDef[] = [
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
      renderCell: (params) => (
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
        {!allHighlights.length ? 'No Highlights Records' : 'All Highlights'}
      </Typography>
      

<Box sx={{ 
  display: 'flex', 
  flexDirection: 'column',
  gap: 1.5,  // Reduced from 2
  padding: 1.5,  // Reduced from 2
}}>
  {/* Search and Date Filter Grid */}
  <Box 
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '2fr 3fr auto' },
      gap: 1,  // Added small gap between grid items
    }}
  >
    {/* Search Box */}
    <Box sx={{ p: 1 }}>  {/* Reduced padding from 2 to 1 */}
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
        p: 1,  // Reduced padding from 2 to 1
        display: 'flex',
        gap: 1,  // Reduced gap from 2 to 1
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
    <Box sx={{ p: 1 }}>  {/* Added padding container for alignment */}
      <CustomButton
        title="Add"
        backgroundColor="primary.light"
        color="primary.dark"
        icon={<Add />}
        handleClick={() => navigate(`/highlights/create`)}
      />
    </Box>
  </Box>

  {/* Status and Category Filter Grid */}
  <Box 
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
      gap: 1,  // Added small gap between grid items
    }}
  >
    {/* Status Filter */}
    <Box sx={{ p: 1 }}>  {/* Reduced padding from 2 to 1 */}
      <ButtonGroup fullWidth size="small">  {/* Added size="small" for a more compact look */}
        <Button
          variant={statusFilter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('all')}
          sx={{
            backgroundColor: statusFilter === 'all' ? 'primary.light' : 'inherit',
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
        p: 1,  // Reduced padding from 2 to 1
        display: 'flex',
        gap: 0.5,  // Added small gap between elements
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
        size="small"  // Reduced size from default to small
        onClick={() => setCategoryManageOpen(true)}
      >
        <Settings fontSize="small" />  {/* Made icon smaller */}
      </IconButton>
    </Box>
  </Box>
</Box>

        
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
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <CategoryManage />
          </DialogContent>
        </Dialog>
    </Paper>
  );
};

export default AllHighlights;