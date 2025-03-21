// components/common/DeleteConfirmationDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { DeleteForever } from '@mui/icons-material';

interface DeleteConfirmationDialogProps {
  open: boolean;
  contentText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  contentText,
  onConfirm,
  onCancel,
}) => {
  const dialogConfig =  {
    title: 'Confirm Permanent Deletion',
    description: `Are you sure you want to permanently delete ${contentText}? This action cannot be undone.`,
    confirmButton: {
      text: 'Delete Permanently',
      icon: <DeleteForever />,
      color: 'error' as const
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">
        <Typography variant="h6">
          {dialogConfig.title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          {dialogConfig.description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color={dialogConfig.confirmButton.color}
          variant="contained"
          startIcon={dialogConfig.confirmButton.icon}
        >
          {dialogConfig.confirmButton.text}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;