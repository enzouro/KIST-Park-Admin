import React from 'react';
import { 
  Box, 
  CircularProgress, 
  FormControl, 
  Paper, 
  TextField, 
  Typography, 
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { Close, Publish } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { HighlightsFormProps, HighlightsFormValues } from 'interfaces/forms';
import CustomButton from 'components/common/CustomButton';
import RichTextArea from 'components/highlights/RichTextArea';
import ImageUploader from './ImageUploader';
import SDGSelect from './SDGDropdown';
import CategoryDropdown from 'components/category/CategoryDropdown';
import useNextSequence from 'hooks/useNextSequence';
import { formatDateForInput } from 'utils/dateHelper';
import { CustomThemeProvider } from 'utils/customThemeProvider';

const STATUS_OPTIONS = [
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
  initialValues = {},
  onFinishHandler,
  handleSubmit,
  register,
  control,
  errors,
  user
}) => {
  const navigate = useNavigate();
  const isCreating = type === 'Create';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get the next sequence number
  const { currentSeq, isLoading: sequenceLoading } = useNextSequence({
    resource: "highlights",
    type: type as "Create" | "Edit",
    initialValues: initialValues?.seq ? { seq: Number(initialValues.seq) } : undefined,
  });
  
  const onSubmit = async (data: HighlightsFormValues) => {
    if (currentSeq === null) {
      return;
    }
  
    // Process SDG data - only join if it's an array
    const formattedSdg = Array.isArray(data.sdg) ? data.sdg.join(', ') : data.sdg;
    
    // Ensure images array is properly formatted
    const images = Array.isArray(data.images) 
      ? data.images.filter(Boolean) // Remove any null/undefined values
      : [];

    // Ensure category is a valid MongoDB ObjectId or empty string
    const categoryId = data.category && typeof data.category === 'object' 
      ? data.category._id 
      : (data.category || '');
    
    const updatedData = { 
      ...data,
      seq: currentSeq,
      sdg: formattedSdg,
      category: categoryId, // Just pass the category ID
      email: user.email,
      images: images,
      createdAt: isCreating ? getTodayDate() : data.createdAt
    };
    
    await onFinishHandler(updatedData);
    navigate('/highlights');
  };
  
  if (sequenceLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  // Format dates for the form display
  const formCreatedAt = formatDateForInput(isCreating ? new Date() : initialValues?.createdAt);
  const formEventDate = formatDateForInput(initialValues?.date);

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
          {type} a Highlights
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
                defaultValue={formCreatedAt}
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
              {...register('title')}
              error={!!errors?.title}
              defaultValue={initialValues?.title || ''}
              required
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
                label="Event Date"
                type="date"
                {...register('date')}
                defaultValue={formEventDate || ''}
                InputLabelProps={{ shrink: true }}
                helperText="Date when the event happened"
                size={isMobile ? "small" : "medium"}
              />
            </FormControl>
            <TextField
              label="Location"
              variant="outlined"
              {...register('location')}
              error={!!errors?.location}
              defaultValue={initialValues?.location || ''}
              size={isMobile ? "small" : "medium"}
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: { xs: 2, md: 3 },
            '& .MuiFormControl-root': { flex: 1 }
          }}>
            <Box sx={{ mb: { xs: 1, sm: 0 }, width: { xs: '100%', sm: '50%' } }}>
              <Controller
                name="category"
                control={control}
                defaultValue={initialValues?.category?._id || initialValues?.category || ''}
                render={({ field }) => (
                  <CategoryDropdown
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    error={!!errors?.category}
                  />
                )} 
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
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
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          </Box>

          {/* SDG Selection component */}
          <Box sx={{ mb: { xs: 1, sm: 2 } }}>
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
          </Box>

          {/* Rich Text Area */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography variant={isMobile ? "subtitle2" : "subtitle1"} sx={{ mb: { xs: 1, sm: 2 } }}>
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
            mb: { xs: 2, sm: 3 },
            '& .MuiFormControl-root': { width: '100%' }
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

          <Box 
            display="flex" 
            flexDirection={isMobile ? "column" : "row"}
            justifyContent="center" 
            gap={isMobile ? 1.5 : 2} 
            mt={isMobile ? 2 : 3}
          >
            <CustomButton
              type="submit"
              title={isCreating ? "Create" : "Update"}
              backgroundColor="primary.light"
              color="primary.dark"
              icon={<Publish fontSize={isMobile ? "small" : "medium"} />}
              fullWidth={isMobile}
            />
            <CustomButton
              title="Cancel"
              backgroundColor="error.light"
              color="error.dark"
              icon={<Close fontSize={isMobile ? "small" : "medium"} />}
              handleClick={() => navigate('/highlights')}
              fullWidth={isMobile}

            />
          </Box>
        </form>
      </Paper>
    </CustomThemeProvider>
  );
};

export default HighlightsForm;