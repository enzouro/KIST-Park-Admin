import { useState } from 'react';
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
  catergory: string;
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

  const { mutate, isLoading: isSubmitting } = useCreate();

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
  
    try {
      await mutate(
        {
          resource: 'categories',
          values: {
            catergory: newCategory,
          },
        },
        {
          onSuccess: (data) => {
            // Change this line to use _id instead of catergory
            onChange(data.data._id);
            setNewCategory('');
            setOpen(false);
            // Optionally refresh the categories list
            refetch();
          },
        },
      );
    } catch (error) {
      console.error('Error adding category:', error);
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

    return categoryData.data.map((item) => {
      const category = item as Category;
      return (
        <MenuItem key={category._id} value={category._id}>
          {category.catergory}
        </MenuItem>
      );
    });
  };

  return (
    <>
      <TextField
        select
        fullWidth
        label="Category"
        value={value}
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