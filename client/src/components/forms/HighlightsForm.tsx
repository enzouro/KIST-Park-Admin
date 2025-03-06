import React from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  OutlinedInput, 
  Paper, 
  TextField, 
  Typography 
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import useNextSequence from 'hooks/useNextSequence';

import { Close, Publish } from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';

import { HighlightsFormProps } from 'interfaces/forms';
import CustomButton from 'components/common/CustomButton';
import ErrorDialog from 'components/common/ErrorDialog';
import LoadingDialog from 'components/common/LoadingDialog';
import RichTextArea from 'components/common/RichTextArea';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HighlightsForm = ({ 
  type, 
  initialValues 
}: HighlightsFormProps) => {
  const isError = false;
  const navigate = useNavigate();

  // Use useForm hook to manage form state
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      seq: '',
      createdAt: initialValues?.createdAt || getTodayDate(),
      title: initialValues?.title || '',
      date: initialValues?.date || '',
      location: initialValues?.location || '',
      sdg: initialValues?.sdg || '',
      content: initialValues?.content || '',
    }
  });

  const { currentSeq, isLoading: sequenceLoading } = useNextSequence({
    resource: "Highlights",
    type: type as "Create" | "Edit",
    initialValues,
  });

  const onSubmit = (data: any) => {
    const updatedData = { 
      ...data,
      seq: currentSeq,
    };
    
    // You would typically pass onFinishHandler as a prop
    // onFinishHandler(updatedData);
    console.log(updatedData);
  };

  if (sequenceLoading || currentSeq === null) {
    return (
      <LoadingDialog 
        open={true}
        loadingMessage="Loading Highlights form..."
      />
    );
  }

  if (isError) {
    return (
      <ErrorDialog 
        open={true}
        errorMessage="Error loading Highlights form"
      />
    );
  }
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        padding: '32px',
        margin: '24px auto',
        maxWidth: '1000px',
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
            <InputLabel htmlFor="seq">Sequence Number</InputLabel>
            <OutlinedInput
              id="seq"
              type="number"
              label="Sequence Number"
              value={currentSeq}
              disabled
              {...register('seq')}
            />
          </FormControl>

          <FormControl>
            <InputLabel htmlFor="date">Created At</InputLabel>
            <OutlinedInput
              id="createdat"
              type="date"
              label="createdAt"
              {...register('createdAt')}
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
            error={!!errors.title}

          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          '& .MuiFormControl-root': { flex: 1 }
        }}>
          <TextField
            label="Date"
            variant="outlined"
            {...register('date')}
            error={!!errors.date}

          />
          <TextField
            label="Location"
            variant="outlined"
            {...register('location')}
            error={!!errors.location}
          />
        </Box>

        <TextField
          label="SDG"
          variant="outlined"
          {...register('sdg')}
          error={!!errors.sdg}

        />

        {/* Rich Text Area Added Here */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Content
          </Typography>
          <Controller
            name="content"
            control={control}
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
          <TextField
            label="Upload image"
            variant="outlined"
          />
          <TextField
            label="Status"
            variant="outlined"
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
            handleClick={() => navigate('')}
          />
        </Box>
      </form>
    </Paper>
  )
}

export default HighlightsForm;