import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));

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
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  return (
    <CustomThemeProvider>
      <Paper
        elevation={2}
        sx={{
          padding: { xs: '16px', sm: '24px', md: '32px' },
          margin: { xs: '12px', sm: '16px', md: '24px' },
          maxWidth: '100%',
          borderRadius: { xs: '8px', sm: '12px', md: '16px' },
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{
            textAlign: 'left',
            mb: { xs: 2, sm: 3, md: 4 },
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
            gap: isMobile ? '16px' : '24px'
          }}
          onSubmit={handleSubmit(onSubmit)}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, md: 3 },
            '& .MuiFormControl-root': { flex: 1 }
          }}>
            <FormControl sx={{ mb: { xs: 1, sm: 0 } }}>
              <TextField
                label="Sequence Number"
                type="number"
                {...register('seq')}
                value={currentSeq || ''}
                disabled
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </FormControl>

            <FormControl>
              <TextField
                label="Created At"
                type="date"
                {...register('createdAt')}
                value={getTodayDate()}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </FormControl>
          </Box>

          <Box sx={{
            width: '100%',
            '& .MuiFormControl-root': { width: '100%' }
          }}>
            <TextField
              label="Title"
              variant="outlined"
              {...register('title', { required: 'Title is required' })}
              error={!!errors?.title}
              defaultValue={initialValues?.title || ''}
              fullWidth
              size={isMobile ? "small" : "medium"}
            />
          </Box>

          <Box sx={{
            width: '100%',
            '& .MuiFormControl-root': { width: '100%' }
          }}>
            <TextField
              label="Publisher"
              variant="outlined"
              {...register('publisher', { required: 'Publisher is required' })}
              error={!!errors?.publisher}
              defaultValue={initialValues?.publisher || ''}
              fullWidth
              size={isMobile ? "small" : "medium"}

            />
          </Box>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, md: 3 },
            '& .MuiFormControl-root': { flex: 1 }
          }}>
            <FormControl sx={{ mb: { xs: 1, sm: 0 } }}>
              <TextField
                label="Date"
                type="date"
                {...register('date', { required: 'Date is required' })}
                error={!!errors?.date}
                defaultValue={initialValues?.date || ''}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size={isMobile ? "small" : "medium"}

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
              size={isMobile ? "small" : "medium"}

            />
          </Box>

          <Box sx={{ 
            mt: { xs: 1, sm: 2 },
            width: '100%'
          }}>
            <Typography 
              variant={isMobile ? "subtitle2" : "subtitle1"} 
              sx={{ mb: { xs: 1, sm: 2 } }}
            >
              Image
            </Typography>
            <Controller
              name="image"
              control={control}
              rules={{ required: 'Image is required' }}
              defaultValue={initialValues?.image || ''}
              render={({ field, fieldState }) => (
                <>
                  <ImageUploader
                    value={field.value}
                    onChange={(imageUrl) => field.onChange(imageUrl)}

                  />
                  {fieldState.error && (
                    <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                      {fieldState.error.message}
                    </Typography>
                  )}
                </>
              )}
            />
          </Box>

          <Box 
            display="flex" 
            flexDirection={isMobile ? "column" : "row"}
            justifyContent="center" 
            gap={isMobile ? 1.5 : 2} 
            mt={isMobile ? 2 : 3}
          >
            <CustomButton
              type="submit"
              title="Publish"
              backgroundColor="primary.light"
              color="primary.dark"
              icon={<Publish fontSize={isMobile ? "small" : "medium"} />}
              fullWidth={isMobile}
            />
            <CustomButton
              title="Close"
              backgroundColor="error.light"
              color="error.dark"
              icon={<Close fontSize={isMobile ? "small" : "medium"} />}
              handleClick={() => navigate('/press-release')}
              fullWidth={isMobile}
            />
          </Box>
        </form>
      </Paper>
    </CustomThemeProvider>
  );
};

export default PressReleaseForm;