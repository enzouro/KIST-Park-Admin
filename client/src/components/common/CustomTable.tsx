import React, { useContext, useMemo, useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef,
  GridSelectionModel, 
  GridSortModel
} from '@pankod/refine-mui';
import { 
  Toolbar,
  Typography,
  Box,
  Stack,
  useMediaQuery,
  Theme,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@pankod/refine-mui';
import { Delete, Edit, Visibility, Restore, MoreVert } from '@mui/icons-material';
import { ColorModeContext } from 'contexts';
import CustomIconButton from 'components/common/CustomIconButton';

interface CustomTableProps {
  rows: any[];
  columns: GridColDef[];
  containerHeight?: string | number;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (ids: string[]) => void;
  onRestore?: (ids: string[]) => void;
  initialSortModel?: GridSortModel;
}

const CustomTableToolbar = ({
  numSelected,
  onView,
  onEdit,
  onDelete,
  onRestore,
  selectedId,
  rows
}: {
  numSelected: number;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (ids: string[]) => void;
  onRestore?: (ids: string[]) => void;
  selectedId?: string;
  rows: any[];
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  // Find the selected row(s)
  const selectedRows = rows.filter(row => selectedId?.split(',').includes(row.id));
  
  // Check if all selected rows have the same deleted status
  const allDeleted = selectedRows.every(row => row.deleted);
  const noneDeleted = selectedRows.every(row => !row.deleted);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const actionMenu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      {numSelected === 1 && (
        <MenuItem onClick={() => {
          selectedId && onView?.(selectedId);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
      )}

      {numSelected === 1 && noneDeleted && (
        <MenuItem onClick={() => {
          selectedId && onEdit?.(selectedId);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      )}

      {allDeleted && onRestore && (
        <MenuItem onClick={() => {
          selectedId && onRestore(selectedId.split(','));
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Restore fontSize="small" />
          </ListItemIcon>
          <ListItemText>Restore {numSelected > 1 ? `(${numSelected})` : ''}</ListItemText>
        </MenuItem>
      )}

      {onDelete && (
        <MenuItem onClick={() => {
          selectedId && onDelete(selectedId.split(','));
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete {numSelected > 1 ? `(${numSelected})` : ''}</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );

  return (
    <Toolbar
      sx={{
        pl: { xs: 1, sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: 'rgba(25, 118, 210, 0.08)',
        }),
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        minHeight: { xs: '56px', sm: '64px' }
      }}
    >
      <Typography
        sx={{ 
          flex: '1 1 100%',
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
        color="inherit"
        variant="subtitle1"
        component="div"
        noWrap
      >
        {numSelected > 0 ? `${numSelected} selected` : 'All Records'}
      </Typography>

      {numSelected > 0 && (
        isMobile ? (
          <>
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              size="small"
            >
              <MoreVert />
            </IconButton>
            {actionMenu}
          </>
        ) : (
          <Stack direction="row" spacing={1}>
            {numSelected === 1 && (
              <>
                <CustomIconButton
                  title="View"
                  icon={<Visibility />}
                  backgroundColor="primary.light"
                  color="primary.dark"
                  handleClick={() => selectedId && onView?.(selectedId)}
                />

                {noneDeleted && (
                  <CustomIconButton
                    title="Edit"
                    icon={<Edit />}
                    backgroundColor="warning.light"
                    color="warning.dark"
                    handleClick={() => selectedId && onEdit?.(selectedId)}
                  />
                )}

                {allDeleted && onRestore && (
                  <CustomIconButton
                    title="Restore"
                    icon={<Restore />}
                    backgroundColor="success.light"
                    color="success.dark"
                    handleClick={() => selectedId && onRestore(selectedId.split(','))}
                  />
                )}
              </>
            )}
    
            {numSelected > 1 && allDeleted && (
              <>
                {onRestore && (
                  <CustomIconButton
                    title={`Restore ${numSelected}`}
                    icon={<Restore />}
                    backgroundColor="success.light"
                    color="success.dark"
                    handleClick={() => selectedId && onRestore(selectedId.split(','))}
                  />
                )}
              </>
            )}
    
            <CustomIconButton
              title={`Delete ${numSelected > 1 ? `(${numSelected})` : ''}`}
              icon={<Delete />}
              backgroundColor="error.light"
              color="error.dark"
              handleClick={() => selectedId && onDelete?.(selectedId.split(','))}
            />
          </Stack>
        )
      )}
    </Toolbar>
  );
};

const CustomTable: React.FC<CustomTableProps> = ({
  rows,
  columns,
  containerHeight = '100%',
  onView,
  onEdit,
  onDelete,
  onRestore,
  initialSortModel = [],
}) => {
  const { mode } = useContext(ColorModeContext);
  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>([]);
  const [sortModel, setSortModel] = useState<GridSortModel>(initialSortModel);
  const [pageSize, setPageSize] = useState(10);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  // Responsive columns handling
  const responsiveColumns = useMemo(() => {
    if (isMobile) {
      // On mobile, we show fewer columns
      return columns.map(column => ({
        ...column,
        flex: 1,
        minWidth: 100,
        // Hide less important columns on mobile
        hide: column.field === 'createdAt' || column.field === 'updatedAt' || column.hide
      }));
    } else if (isTablet) {
      // On tablets, show more columns but still optimize
      return columns.map(column => ({
        ...column,
        flex: 1,
        minWidth: 120,
        // Maybe hide only some columns
        hide: column.field === 'updatedAt' || column.hide
      }));
    }
    return columns;
  }, [columns, isMobile, isTablet]);

  // Sorting logic for rows
  const sortedRows = useMemo(() => {
    if (sortModel.length === 0) return rows;

    return [...rows].sort((a, b) => {
      for (const sort of sortModel) {
        const field = sort.field;
        const value1 = a[field];
        const value2 = b[field];

        if (value1 !== value2) {
          return sort.sort === 'asc' 
            ? (value1 > value2 ? 1 : -1)
            : (value1 < value2 ? 1 : -1);
        }
      }
      return 0;
    });
  }, [rows, sortModel]);

  // Adjust page size for smaller screens
  useEffect(() => {
    setPageSize(isMobile ? 5 : isTablet ? 7 : 10);
  }, [isMobile, isTablet]);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      overflow: 'auto'
    }}>
      <DataGrid
        rows={sortedRows}
        columns={responsiveColumns}
        checkboxSelection
        disableSelectionOnClick
        autoHeight={false}
        selectionModel={selectionModel}
        onSelectionModelChange={(newSelectionModel) => {
          setSelectionModel(newSelectionModel);
        }}
        pagination
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        rowsPerPageOptions={isMobile ? [5, 10] : [10, 25, 50]}
        sortModel={sortModel}
        onSortModelChange={(model) => setSortModel(model)}
        components={{
          Toolbar: () => (
            <CustomTableToolbar
              numSelected={selectionModel.length}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              selectedId={selectionModel.join(',')}
              rows={rows}
            />
          ),
        }}
        sx={{
          height: containerHeight,
          '& .MuiDataGrid-main': {
            overflow: 'hidden',
            '& ::-webkit-scrollbar': {
              width: '10px',
              height: '10px',
            },
            '& ::-webkit-scrollbar-track': {
              background: mode === 'light' ? '#f1f1f1' : '#2c2c2c',
              borderRadius: '10px',
            },
            '& ::-webkit-scrollbar-thumb': {
              background: mode === 'light' 
                ? 'linear-gradient(45deg, #e0e0e0, #a0a0a0)' 
                : 'linear-gradient(45deg, #4a4a4a, #2c2c2c)',
              borderRadius: '10px',
              transition: 'background 0.3s ease',
            },
            '& ::-webkit-scrollbar-thumb:hover': {
              background: mode === 'light'
                ? 'linear-gradient(45deg, #c0c0c0, #808080)'
                : 'linear-gradient(45deg, #5a5a5a, #3c3c3c)',
            },
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          '& .MuiDataGrid-cell': {
            padding: { xs: '4px 6px', sm: '8px' },
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: mode === 'light' ? '#f5f5f5' : '#333333',
            borderBottom: mode === 'light' ? '2px solid #e0e0e0' : '2px solid #444444',
            color: mode === 'light' ? 'inherit' : '#f5f5f5'
          },
          '& .MuiDataGrid-columnHeader': {
            padding: { xs: '4px 6px', sm: '8px' },
            fontWeight: 'bold',
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '& .MuiTablePagination-root': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }
        }}
      />
    </Box>
  );
};

export default CustomTable;