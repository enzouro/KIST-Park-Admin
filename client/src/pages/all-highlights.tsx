import { useState, useMemo } from 'react';


import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  ButtonGroup,
  Chip,
  ChipProps,
} from "@mui/material";

import { Add } from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import CustomButton from 'components/common/CustomButton';
import CustomTable from 'components/common/CustomTable';
import useDynamicHeight from 'hooks/useDynamicHeight';
import DeleteConfirmationDialog from 'components/common/DeleteConfirmationDialog';
import useDeleteWithConfirmation from 'hooks/useDeleteWithConfirmation';
import useRestoreWithConfirmation from 'hooks/useRestoreWithConfirmation';


import ErrorDialog from 'components/common/ErrorDialog';
import LoadingDialog from 'components/common/LoadingDialog';
import { useTable } from '@pankod/refine-core';
import { GridColDef } from '@pankod/refine-mui';
import { format } from 'date-fns';

// Define type for Highlight
interface SDG {
  _id: string;
  name?: string;
  code?: string;
}

interface Highlight {
  _id: string;
  title: string;
  date?: string;
  location?: string;
  sdg: SDG[];
  status: 'draft' | 'published' | 'rejected';
  createdAt: string;
  content: string;
  image?: string;
}

interface TableRow {
  id: string;
  title: string;
  date?: string;
  location: string;
  sdg: SDG[];
  status: 'draft' | 'published' | 'rejected';
  createdAt: string;
  content: string;
  image?: string;
}

const AllHighlights: React.FC = () => {
  const navigate = useNavigate();
  const containerHeight = useDynamicHeight();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Use both delete and restore hooks
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
    error: restoreError,
    handleTableRestore,
    isLoading: isRestoreLoading,
    closeErrorDialog: closeRestoreErrorDialog,
  } = useRestoreWithConfirmation({
    resource: 'highlights',
    redirectPath: '/highlights',
  });

  // Use refine's useTable hook with proper filters
  const { 
    tableQueryResult: { data, isLoading, isError }
    
  } = useTable();

  const allHighlights = (data?.data as Highlight[]) ?? [];

  // Filter highlights based on search term and date range
  const filteredRows = useMemo(() => {
    return allHighlights.filter((highlight) => {
      // Check title for search term
      const titleMatch = highlight.title.toLowerCase().includes(searchTerm.toLowerCase());

      // Check date range
      let dateMatch = true;
      if (highlight.date) {
        const highlightDate = new Date(highlight.date);
        if (startDate && new Date(startDate) > highlightDate) {
          dateMatch = false;
        }
        if (endDate && new Date(endDate) < highlightDate) {
          dateMatch = false;
        }
      }

      // Check status filter
      const statusMatch = !statusFilter || highlight.status === statusFilter;

      return titleMatch && dateMatch && statusMatch;
    });
  }, [allHighlights, searchTerm, startDate, endDate, statusFilter]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.5, sortable: true, hide: true },
    { field: 'title', headerName: 'Title', flex: 2, sortable: true },
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 1, 
      sortable: true,
      renderCell: (params) => params.value ? format(new Date(params.value as string), 'MMM dd, yyyy') : 'N/A'
    },
    { field: 'location', headerName: 'Location', flex: 1, sortable: true },
    { 
      field: 'sdg', 
      headerName: 'SDGs', 
      flex: 1.5, 
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {(params.value as SDG[]).map((sdg) => (
            <Chip
              key={sdg._id}
              label={sdg.name || sdg.code}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ margin: '2px' }}
            />
          ))}
        </Stack>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1, 
      sortable: true,
      renderCell: (params) => {
        const value = params.value as string;
        let chipColor: ChipProps['color'] = 'default';
        
        switch(value) {
          case 'published':
            chipColor = 'success';
            break;
          case 'draft':
            chipColor = 'warning';
            break;
          case 'rejected':
            chipColor = 'error';
            break;
        }
        
        return <Chip label={value} color={chipColor} size="small" />;
      }
    },
    { 
      field: 'createdAt', 
      headerName: 'Created', 
      flex: 1, 
      sortable: true,
      renderCell: (params) => format(new Date(params.value as string), 'MMM dd, yyyy')
    }
  ];

  const handleView = (id: string) => {
    navigate(`/highlights/show/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/highlights/edit/${id}`);
  };
  
  const rows: TableRow[] = filteredRows.map((highlight) => ({
    id: highlight._id,
    title: highlight.title,
    date: highlight.date,
    location: highlight.location || 'N/A',
    sdg: highlight.sdg || [],
    status: highlight.status,
    createdAt: highlight.createdAt,
    content: highlight.content,
    image: highlight.image
  }));

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
  };

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
        height: containerHeight,
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
        {!allHighlights.length ? 'No Highlights Records' : 'Highlights'}
      </Typography>
      
      <Box sx={{ 
        p: 2,
        display: 'flex', 
        flexDirection: {xs: 'column', md: 'row'},
        gap: 2,
        alignItems: {xs: 'stretch', md: 'center'},
        justifyContent: 'space-between'
      }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ flex: 1, alignItems: 'center' }}
        >
          <TextField
            size="small"
            label="Search"
            placeholder="Search by title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: '250px' }}
          />
          <TextField
            size="small"
            label="From Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="To Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <ButtonGroup size="small" variant="outlined">
            <Button 
              color={statusFilter === 'draft' ? 'warning' : 'inherit'}
              onClick={() => handleStatusFilterChange('draft')}
            >
              Draft
            </Button>
            <Button 
              color={statusFilter === 'published' ? 'success' : 'inherit'} 
              onClick={() => handleStatusFilterChange('published')}
            >
              Published
            </Button>
            <Button 
              color={statusFilter === 'rejected' ? 'error' : 'inherit'}
              onClick={() => handleStatusFilterChange('rejected')}
            >
              Rejected
            </Button>
          </ButtonGroup>
        </Stack>

        <CustomButton
          title="Add Highlight"
          backgroundColor="primary.light"
          color="primary.dark"
          icon={<Add />}
          handleClick={() => navigate('/highlights/create')}
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
          onView={handleView}
          onEdit={handleEdit}
          onDelete={(ids) => handleTableDelete(ids, rows)}
          initialSortModel={[{ field: 'createdAt', sort: 'desc' }]}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmation.open}
        isDeleted={deleteConfirmation.isDeleted}
        contentText={`Are you sure you want to delete this highlight?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Loading Dialogs */}
      <LoadingDialog 
        open={isDeleteLoading} 
        loadingMessage="Deleting highlight..." 
      />
      <LoadingDialog 
        open={isRestoreLoading} 
        loadingMessage="Restoring highlight..." 
      />

      {/* Error Dialogs */}
      <ErrorDialog
        open={deleteError.open}
        errorMessage={deleteError.message}
        onClose={closeDeleteErrorDialog}
      />
      <ErrorDialog
        open={restoreError.open}
        errorMessage={restoreError.message}
        onClose={closeRestoreErrorDialog}
      />
    </Paper>
  );
};

export default AllHighlights;