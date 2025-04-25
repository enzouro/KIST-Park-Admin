import React, { useContext, useState, useEffect } from 'react';
import { useList, useUpdate, useDelete } from '@pankod/refine-core';
import {
  DataGrid,
  GridColDef,
  Toolbar,
  Typography,
  Box,
  Stack,
  Checkbox,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip
} from '@pankod/refine-mui';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { ColorModeContext } from 'contexts';
import CustomIconButton from 'components/common/CustomIconButton';
import useDynamicHeight from 'hooks/useDynamicHeight';
import LoadingDialog from 'components/common/LoadingDialog';
import ErrorDialog from 'components/common/ErrorDialog';

const UserManagement = () => {
  const { data, isLoading, isError, refetch } = useList({
    resource: 'user-management',
  });

  const { mutate: updateUser } = useUpdate();
  const { mutate: deleteUser } = useDelete();
  const { mode } = useContext(ColorModeContext);
  const containerHeight = useDynamicHeight();
  const [selectionModel, setSelectionModel] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const users = data?.data.map((user) => ({
    ...user,
    id: user._id, // Map `_id` to `id`
  })) ?? [];

  const handleDeleteUsers = () => {
    selectionModel.forEach((id) => {
      deleteUser({ resource: 'user-management', id });
    });
    refetch();
    setSelectionModel([]);
    setDeleteDialogOpen(false);
  };

  const handleAllowedToggle = () => {
    if (currentUser) {
      updateUser(
        {
          resource: 'user-management',
          id: currentUser._id,
          values: { isAllowed: !currentUser.isAllowed },
        },
        { onSuccess: () => refetch() }
      );
      setToggleDialogOpen(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const openToggleDialog = (user: any) => {
    setCurrentUser(user);
    setToggleDialogOpen(true);
  };

  const CustomTableToolbar = () => (
    <Toolbar
      sx={{
        pl: { xs: 1, sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(selectionModel.length > 0 && { bgcolor: 'rgba(25, 118, 210, 0.08)' }),
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        minHeight: { xs: '48px', sm: '64px' }
      }}
    >
      <Typography
        sx={{ 
          flex: '1 1 100%',
          fontSize: { xs: '0.875rem', sm: '1rem' } 
        }}
        color="inherit"
        variant={isMobile ? "body1" : "subtitle1"}
        component="div"
      >
        {selectionModel.length > 0
          ? `${selectionModel.length} selected`
          : 'All Records'}
      </Typography>
      {selectionModel.length > 0 && (
        <Stack 
          direction="row" 
          spacing={1}
          sx={{ mt: { xs: 1, sm: 0 } }}
        >
          <CustomIconButton
            title={`Delete ${selectionModel.length > 1 ? `(${selectionModel.length})` : ''}`}
            icon={<DeleteIcon fontSize={isMobile ? "small" : "medium"} />}
            backgroundColor="error.light"
            color="error.dark"
            handleClick={openDeleteDialog}
            size={isMobile ? "small" : "medium"}
          />
        </Stack>
      )}
    </Toolbar>
  );

  // Define mobile and desktop column configurations
  const getColumns = (): GridColDef[] => {
    const baseColumns: GridColDef[] = [
      {
        field: 'avatar',
        headerName: 'Avatar',
        width: isMobile ? 60 : 100,
        renderCell: (params) => (
          <img
            src={params.value}
            alt="avatar"
            style={{ 
              width: isMobile ? 30 : 40, 
              height: isMobile ? 30 : 40, 
              borderRadius: '50%' 
            }}
          />
        ),
      },
      { 
        field: 'name', 
        headerName: 'Name', 
        flex: 1,
        minWidth: 120
      },
    ];

    // Additional columns for non-mobile views
    if (!isMobile) {
      baseColumns.push(
        { 
          field: 'email', 
          headerName: 'Email', 
          flex: 1,
          minWidth: 180 
        },
        {
          field: 'isAdmin',
          headerName: 'Role',
          width: 100,
          valueGetter: (params) => (params.row.isAdmin ? 'Admin' : 'User'),
        }
      );
    }

    // Status column (different rendering based on device)
    baseColumns.push({
      field: 'isAllowed',
      headerName: isMobile ? 'Status' : 'Is Allowed',
      width: isMobile ? 80 : 120,
      renderCell: (params) => (
        isMobile ? (
          <Tooltip title={params.row.isAllowed ? "Allowed" : "Not Allowed"}>
            <IconButton 
              onClick={() => openToggleDialog(params.row)}
              size="small"
              color={params.row.isAllowed ? "success" : "error"}
            >
              {params.row.isAllowed ? 
                <CheckCircleIcon fontSize="small" /> : 
                <CancelIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>
        ) : (
          <Checkbox
            checked={params.row.isAllowed}
            onChange={() => openToggleDialog(params.row)}
          />
        )
      ),
    });

    return baseColumns;
  };

  if (isLoading) {
    return (
      <LoadingDialog 
        open={isLoading}
        loadingMessage="Loading users data..."
      />
    );
  }

  if (isError) {
    return (
      <ErrorDialog 
        open={true}
        errorMessage="Error loading users data"
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
        m: { xs: 1, sm: 2 },
        overflow: 'hidden',
        borderRadius: { xs: '8px', sm: '12px' }
      }}
    >
      <Typography
        variant={isMobile ? "h5" : "h4"}
        sx={{
          p: { xs: 1.5, sm: 2 },
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
        }}
      >
        User Management
      </Typography>
      <Box 
        sx={{ 
          flexGrow: 1,
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={users}
          columns={getColumns()}
          checkboxSelection={!isMobile}
          disableSelectionOnClick
          autoHeight={false}
          hideFooterSelectedRowCount={isMobile}
          selectionModel={selectionModel}
          onSelectionModelChange={(newSelectionModel) =>
            setSelectionModel(newSelectionModel as string[])
          }
          components={{
            Toolbar: CustomTableToolbar,
          }}
          pageSize={isMobile ? 10 : 15}
          density={isMobile ? "compact" : "standard"}
          sx={{
            height: '100%',
            '& .MuiDataGrid-main': {
              overflow: 'hidden'
            },
            '& ::-webkit-scrollbar': {
              width: isMobile ? '6px' : '10px',
              height: isMobile ? '6px' : '10px',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            '& .MuiDataGrid-cell': {
              padding: isMobile ? '4px' : '8px',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              fontSize: isMobile ? '0.75rem' : 'inherit'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: mode === 'light' ? '#f5f5f5' : '#333333',
              borderBottom: mode === 'light' ? '2px solid #e0e0e0' : '2px solid #444444',
              color: mode === 'light' ? 'inherit' : '#f5f5f5'
            },
            '& .MuiDataGrid-columnHeader': {
              padding: isMobile ? '4px' : '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.75rem' : 'inherit'
            },
            '& .MuiDataGrid-footerContainer': {
              minHeight: isMobile ? '40px' : '56px'
            },
            '& .MuiTablePagination-root': {
              fontSize: isMobile ? '0.75rem' : 'inherit'
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: isMobile ? '0.75rem' : 'inherit'
            }
          }}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth={isMobile}
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Are you sure you want to delete the selected users? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="primary"
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUsers}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon fontSize={isMobile ? "small" : "medium"} />}
            size={isMobile ? "small" : "medium"}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Allowed Dialog */}
      <Dialog 
        open={toggleDialogOpen} 
        onClose={() => setToggleDialogOpen(false)}
        fullWidth={isMobile}
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
          Change User Permission
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Are you sure you want to {currentUser?.isAllowed ? 'disallow' : 'allow'} this user?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setToggleDialogOpen(false)} 
            color="primary"
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAllowedToggle} 
            color="primary" 
            variant="contained"
            size={isMobile ? "small" : "medium"}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserManagement;