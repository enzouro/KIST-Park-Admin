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

import { HighlightsFormProps } from 'interfaces/forms';
import CustomButton from 'components/common/CustomButton';
import RichTextArea from 'components/highlights/RichTextArea';
import ImageUploader from './ImageUploader';
import SDGSelect from './SDGDropdown';
import useNextSequence from 'hooks/useNextSequence';

const status = [
  { value: 'rejected', label: 'Rejected' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



const HighlightsForm: React.FC<HighlightsFormProps> = ({ 
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
    resource: "highlights",
    type: type as "Create" | "Edit",
    initialValues: initialValues?.seq ? { seq: Number(initialValues.seq) } : undefined,
  });

  useEffect(() => {
    console.log('Current Sequence:', currentSeq);
    console.log('Sequence Loading:', sequenceLoading);
  }, [currentSeq, sequenceLoading]);

  
  const onSubmit = async (data: any) => {
    if (currentSeq === null) {
      console.error('No sequence number available');
      return;
    }
  
    const formattedSdg = Array.isArray(data.sdg) ? data.sdg.join(', ') : data.sdg;
    
    // Ensure images is an array of strings
    const images = Array.isArray(data.images) ? data.images : [];
    
    const updatedData = { 
      ...data,
      seq: currentSeq,
      sdg: formattedSdg,
      email: user.email,
      images: images // Make sure this is included
    };
    
    console.log('Submitting data:', updatedData); // Add this for debugging
    await onFinishHandler(updatedData);
    navigate('/highlights');
  };
  
  if (sequenceLoading) {
    return <CircularProgress />;
  }


  
  
  return (
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
        {type} a Highlights
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
                value={ getTodayDate()}
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
            {...register('title')}
            error={!!errors?.title}
            defaultValue={initialValues?.title || ''}
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
                {...register('date')}
                defaultValue={initialValues?.date || ''}
                InputLabelProps={{ shrink: true }}
              />

          </FormControl>
          <TextField
            label="Location"
            variant="outlined"
            {...register('location')}
            error={!!errors?.location}
            defaultValue={initialValues?.location || ''}
          />
          <Controller
            name="status"
            control={control}
            defaultValue={initialValues?.status || 'draft'}
            render={({ field }) => (
              <TextField
                select
                label="Status"
                value={field.value}
                onChange={field.onChange}
                helperText="Please select the status"
                variant="filled"
                SelectProps={{
                  native: true,
                }}
              >
                {status.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            )}
          />
        </Box>

        {/* SDG Selection component */}
        <Controller
          name="sdg"
          control={control}
          defaultValue={initialValues?.sdg || []}
          render={({ field }) => (
            <SDGSelect
              value={field.value || []}
              onChange={field.onChange}
              error={!!errors?.sdg}
            />
          )}
        />

        {/* Rich Text Area Added Here */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Content
          </Typography>
          <Controller
            name="content"
            control={control}
            defaultValue={initialValues?.content || ''}
            render={({ field }) => (
              <RichTextArea 
                value={field.value} 
                onChange={field.onChange} 
              />
            )}
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          alignItems: 'center',
          '& .MuiFormControl-root': { flex: 1 }
        }}>
          <Controller
              name="images"
              control={control}
              defaultValue={initialValues?.images || []}
              render={({ field }) => (
                  <ImageUploader
                      value={field.value}
                      onChange={(newImages) => field.onChange(newImages)}
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
            handleClick={() => navigate('/highlights')}
          />
        </Box>
      </form>
    </Paper>
  );
};

export default HighlightsForm;