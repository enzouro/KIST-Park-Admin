import { useState, useEffect } from 'react';
import {
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useCreate, useList } from '@pankod/refine-core';

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

interface Category {
  _id: string;
  // Fixed typo in property name
  category: string;
}

const CategoryDropdown = ({ value, onChange, error }: CategoryDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const { data: categoryData, isLoading, refetch } = useList({
    resource: 'categories',
    config: {
      hasPagination: false,
    }
  });

  const getCategoryId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val._id) return val._id;
    return '';
  };


  // Check if the value exists in available options
// Modify the isValidValue check to handle initial loading state
    const isValidValue = !isLoading && 
        (categoryData?.data?.length ?? 0) > 0 && 
        (value === '' || categoryData?.data?.some((item) => 
          (item as Category)._id === getCategoryId(value)
        )); 
// Modify the useEffect to prevent unnecessary resets
      useEffect(() => {
        if (!isLoading && categoryData?.data?.length && value) {
          const categoryId = getCategoryId(value);
          const valueExists = categoryData.data.some(
            (item) => (item as Category)._id === categoryId
          );
          
          if (!valueExists) {
            onChange('');
          }
        }
      }, [categoryData, isLoading, value, onChange]);

  const { mutate, isLoading: isSubmitting } = useCreate();

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
  
    try {
      await mutate(
        {
          resource: 'categories',
          values: {

            // Keep this as is if the backend API expects this spelling
            category: newCategory,
          },
        },
        {
          onSuccess: (data) => {
            onChange(data.data._id);
            setNewCategory('');
            setOpen(false);
            refetch();
          },
        },
      );
    } catch (error) {
      
    }
  };

  const renderMenuItems = () => {
    if (isLoading) {
      return (
        <MenuItem disabled>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Loading categories...
        </MenuItem>
      );
    }

    if (!categoryData?.data?.length) {
      return (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            No categories available
          </Typography>
        </MenuItem>
      );
    }

    return (categoryData.data as Category[]).map((item) => (
      <MenuItem key={item._id} value={item._id}>
        {item.category} {/* Use the correct property name */}
      </MenuItem>
    ));
  };


  return (
    <>
      <TextField
        select
        fullWidth
        required
        label="Category"
        // Only set value if it's valid or empty
        value={isLoading ? '' : (isValidValue ? getCategoryId(value) : '')}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              style: {
                maxHeight: 300,
              },
            },
          },
        }}
      >
        <MenuItem value="" disabled>
          Select a category
        </MenuItem>
        {renderMenuItems()}
        <MenuItem
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          sx={{
            borderTop: '1px solid #eee',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AddIcon fontSize="small" />
          Add New Category
        </MenuItem>
      </TextField>

      <Dialog 
        open={open} 
        onClose={() => !isSubmitting && setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              disabled={isSubmitting}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isSubmitting) {
                  handleAddCategory();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCategory}
            variant="contained"
            disabled={!newCategory.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Adding...
              </>
            ) : (
              'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategoryDropdown;