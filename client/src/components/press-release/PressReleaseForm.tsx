import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { Close, Publish } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { PressReleaseFormProps, PressReleaseFormValues } from 'interfaces/forms';
import CustomButton from 'components/common/CustomButton';
import useNextSequence from 'hooks/useNextSequence';
import ImageUploader from './ImageUploader';
import { CustomThemeProvider } from 'utils/customThemeProvider';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PressReleaseForm: React.FC<PressReleaseFormProps> = ({
  type,
  initialValues,
  onFinishHandler,
  handleSubmit,
  register,
  control,
  errors,
  user
}) => {
  const navigate = useNavigate();

  // Get the next sequence number
  const { currentSeq, isLoading: sequenceLoading } = useNextSequence({
    resource: "press-release",
    type: type as "Create" | "Edit",
    initialValues: initialValues?.seq ? { seq: Number(initialValues.seq) } : undefined,
  });

  const onSubmit = async (data: PressReleaseFormValues) => {
    if (currentSeq === null) {
      console.error('No sequence number available');
      return;
    }

    const updatedData = {
      ...data,
      seq: currentSeq,
      createdAt: new Date().toISOString(),
      date: data.date || getTodayDate(),
    };

    if (!updatedData.image) {
      // Show error or handle missing image
      return;
    }

    await onFinishHandler(updatedData);
  };

  if (sequenceLoading) {
    return <CircularProgress />;
  }

  return (
    <CustomThemeProvider>
    <Paper
      elevation={2}
      sx={{
        padding: '32px',
        margin: '24px auto',
        maxWidth: '100%',
        borderRadius: '16px',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Typography
        variant="h4"
        sx={{
          textAlign: 'left',
          mb: 4,
          fontWeight: 600,
        }}
      >
        {type} a Press Release
      </Typography>

      <form
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          '& .MuiFormControl-root': { flex: 1 }
        }}>
          <FormControl>
            <TextField
              label="Sequence Number"
              type="number"
              {...register('seq')}
              value={currentSeq || ''}
              disabled
              InputLabelProps={{ shrink: true }}
            />
          </FormControl>

          <FormControl>
            <TextField
              label="Created At"
              type="date"
              {...register('createdAt')}
              value={getTodayDate()}
              InputLabelProps={{ shrink: true }}
            />
          </FormControl>
        </Box>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          '& .MuiFormControl-root': { flex: 1 }
        }}>
          <TextField
            label="Title"
            variant="outlined"
            {...register('title', { required: 'Title is required' })}  // Add this
            error={!!errors?.title}
            defaultValue={initialValues?.title || ''}
            fullWidth
          />
        </Box>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          '& .MuiFormControl-root': { flex: 1 }
        }}>
          <TextField
            label="Publisher"
            variant="outlined"
            {...register('publisher', { required: 'Publisher is required' })}
            error={!!errors?.publisher}
            defaultValue={initialValues?.publisher || ''}
            fullWidth
          />
        </Box>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          '& .MuiFormControl-root': { flex: 1 }
        }}>
          <FormControl>
            <TextField
              label="Date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              error={!!errors?.date}
              defaultValue={initialValues?.date || ''}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </FormControl>

          <TextField
            label="Link"
            variant="outlined"
            {...register('link', {
              required: 'Link is required',
              pattern: {
                value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                message: 'Please enter a valid URL'
              }
            })}
            error={!!errors?.link}
            defaultValue={initialValues?.link || ''}
            fullWidth
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Controller
            name="image"
            control={control}
            rules={{ required: 'Image is required' }}
            defaultValue={initialValues?.image || ''}
            render={({ field }) => (
              <ImageUploader
                value={field.value}
                onChange={(imageUrl) => field.onChange(imageUrl)}
              />
            )}
          />
        </Box>

        <Box display="flex" justifyContent="center" gap={2} mt={3}>
          <CustomButton
            type="submit"
            title="Publish"
            backgroundColor="primary.light"
            color="primary.dark"
            icon={<Publish />}
          />
          <CustomButton
            title="Close"
            backgroundColor="error.light"
            color="error.dark"
            icon={<Close />}
            handleClick={() => navigate('/press-release')}
          />
        </Box>
      </form>
    </Paper>
    </CustomThemeProvider>
  );
};

export default PressReleaseForm;