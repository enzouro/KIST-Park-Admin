import React, { useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useGetIdentity, useShow } from '@pankod/refine-core';
import { useForm } from '@pankod/refine-react-hook-form';

import LoadingDialog from 'components/common/LoadingDialog';
import ErrorDialog from 'components/common/ErrorDialog';
import HighlightsForm from 'components/highlights/HighlightsForm';
import { HighlightsFormValues } from 'interfaces/forms';
import { formatDateForAPI, formatDateForInput } from 'utils/dateHelper';

const EditHighlights = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: user } = useGetIdentity();

  // Fetch highlight data
  const { queryResult } = useShow({
    resource: 'highlights',
    id: id as string,
    metaData: {
      populate: ['sdg', 'category'] 
    }
  });

  const {
    data: highlightData,
    isLoading: isDataLoading,
    isError
  } = queryResult || { data: null, isLoading: true, isError: false };

  // Form setup
  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<HighlightsFormValues>({
    refineCoreProps: {
      resource: "highlights",
      action: "edit",
      id: id as string,
      redirect: false,
    }
  });

  // Utility functions for data processing - simplified and improved
  const processSdg = (sdgData: string) => {
    if (!sdgData) return [];
    
    if (Array.isArray(sdgData)) {
      return sdgData.map(item => 
        typeof item === 'object' && item._id ? item._id : item
      );
    }
    
    if (typeof sdgData === 'string') {
      // Try to parse if it looks like JSON
      if (sdgData.startsWith('[') && sdgData.endsWith(']')) {
        try {
          return JSON.parse(sdgData);
        } catch (e) {
          // Fall back to simple splitting if parsing fails
          return sdgData.split(',').map(s => s.trim());
        }
      }
      return sdgData.split(',').map(s => s.trim());
    }
    
    return [sdgData];
  };

  const processImages = (imagesData: any[]) => {
    if (!imagesData) return [];
    
    if (Array.isArray(imagesData)) {
      return imagesData.map(img => {
        if (typeof img === 'string') return img;
        return img?.url || '';
      }).filter(Boolean);
    }
    
    return typeof imagesData === 'string' ? [imagesData] : [];
  };

  const formatDate = (dateString: string | number | Date) => {
    return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
  };

  // Initialize form when data is available
// In the useEffect where form is initialized
    useEffect(() => {
      if (highlightData?.data) {
        const data = highlightData.data;
        
        // Extract category ID properly
        const categoryId = data.category?._id || data.category || '';
        
        const formattedCreatedAt = formatDateForInput(data.createdAt) || 
        new Date().toISOString().split('T')[0]; // Fallback to today if empty
      
        reset({
          seq: data.seq || '',
          createdAt: formattedCreatedAt,
          title: data.title || '',
          date: formatDate(data.date),
          location: data.location || '',
          category: categoryId, // Just pass the ID
          sdg: processSdg(data.sdg),
          content: data.content || '',
          images: processImages(data.images),
          status: data.status || 'draft'
        });
      }
    }, [highlightData, reset]);

  // Form submission handler
  const onFinishHandler = async (data: HighlightsFormValues) => {
      const formattedData = {
        ...data,
        date: formatDateForAPI(data.date),
        createdAt: formatDateForAPI(data.createdAt)
      };
      await onFinish(formattedData);
      navigate('/highlights');
  };

  // Loading state
  if (isDataLoading || formLoading || !highlightData?.data) {
    return <LoadingDialog open={true} loadingMessage="Loading Highlights data..." />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorDialog
        open={true}
        errorMessage="Error loading Highlights data. Please try again."
        onClose={() => navigate('/highlights')}
      />
    );
  }

  // Process data once for the form
  const processedData = {
    ...highlightData.data,
    category: highlightData.data.category?._id || '',
    sdg: processSdg(highlightData.data.sdg),
    images: processImages(highlightData.data.images),
    date: formatDate(highlightData.data.date),
    createdAt: formatDate(highlightData.data.createdAt)
  };

  // Render form
  return (
    <HighlightsForm
      type="Edit"
      initialValues={processedData}
      control={control}
      register={register}
      handleSubmit={handleSubmit}
      onFinishHandler={onFinishHandler}
      errors={errors}
      user={user}
    />
  );
};

export default EditHighlights;