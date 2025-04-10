import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useCreate, useUpdate, useDelete, useList } from '@pankod/refine-core';

const CategoryManage = () => {
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState({ id: '', name: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch categories
  const { data: categoryData, isLoading } = useList({
    resource: 'categories',
  });

  // Create mutation
  const { mutate: createMutate } = useCreate();
  
  // Update mutation
  const { mutate: updateMutate } = useUpdate();
  
  // Delete mutation
  const { mutate: deleteMutate } = useDelete();

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    
    createMutate({
      resource: 'categories',
      values: {
        category: newCategory,
      },
    });
    
    setNewCategory('');
  };

  const handleEdit = (id: string, name: string) => {
    setEditCategory({ id, name });
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editCategory.name.trim()) return;

    updateMutate({
      resource: 'categories',
      id: editCategory.id,
      values: {
        category: editCategory.name,
      },
    });

    setEditDialogOpen(false);
    setEditCategory({ id: '', name: '' });
  };

  const handleDelete = (id: string) => {
    deleteMutate({
      resource: 'categories',
      id: id,
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Add Category Section */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          label="New Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add
        </Button>
      </Box>

      {/* Categories List */}
      <List>
        {categoryData?.data.map((category: any) => (
          <ListItem
            key={category._id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText primary={category.category} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleEdit(category._id, category.category)}
                sx={{ mr: 1 }}
              >
                <Edit />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleDelete(category._id)}
                color="error"
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={editCategory.name}
            onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManage;