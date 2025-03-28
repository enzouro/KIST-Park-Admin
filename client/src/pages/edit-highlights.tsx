import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useGetIdentity, useShow } from '@pankod/refine-core';
import { useForm } from '@pankod/refine-react-hook-form';

import LoadingDialog from 'components/common/LoadingDialog';
import ErrorDialog from 'components/common/ErrorDialog';
import HighlightsForm from 'components/highlights/HighlightsForm';
import { HighlightsFormValues } from 'interfaces/forms';

const EditHighlights = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: user } = useGetIdentity();
  const [isFormReady, setIsFormReady] = useState(false);

  // Fetch highlight data
// Modify the useShow hook to properly handle the response
const { queryResult } = useShow({
  resource: 'highlights',
  id: id as string,
  metaData: {
    populate: ['sdg', 'category'] 
  }
});

console.log('Query Result:', queryResult);


const {
  data: highlightData,
  isLoading: isDataLoading,
  isError
} = queryResult || { data: null, isLoading: true, isError: false };

// Add debugging for the data
useEffect(() => {
  console.log('Highlight Data:', highlightData);
  if (highlightData?.data) {
    const data = highlightData.data;
    console.log('Processed Data:', {
      seq: data.seq || '',
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : '',
      title: data.title || '',
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
      location: data.location || '',
      category: data.category?._id || '',
      sdg: processSdg(data.sdg),
      content: data.content || '',
      images: processImages(data.images),
      status: data.status || 'draft'
    });
  }
}, [highlightData]);

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

  // Process SDG data
  const processSdg = (sdgData: any) => {
    if (!sdgData) return [];
    
    if (typeof sdgData === 'string') {
      if (sdgData.includes('[') && sdgData.includes(']')) {
        try {
          return JSON.parse(sdgData.replace(/'/g, '"'));
        } catch (e) {
          return sdgData.split(',').map(s => s.trim());
        }
      }
      return sdgData.split(',').map(s => s.trim());
    }
    
    if (Array.isArray(sdgData)) {
      return sdgData.map(item => 
        typeof item === 'object' && item._id ? item._id : item
      );
    }
    
    return [sdgData];
  };

  // Process images data
  const processImages = (imagesData: any) => {
    if (!imagesData) return [];
    
    if (Array.isArray(imagesData)) {
      return imagesData.map(img => {
        if (typeof img === 'string') return img;
        return img?.url || '';
      }).filter(Boolean);
    }
    
    return typeof imagesData === 'string' ? [imagesData] : [];
  };

  // Initialize form when data is available
  useEffect(() => {
    if (highlightData?.data) {
      const data = highlightData.data;
      const processedSdg = processSdg(data.sdg);
      const processedImages = processImages(data.images);

      reset({
        seq: data.seq || '',
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : '',
        title: data.title || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        location: data.location || '',
        category: data.category?._id || '',
        sdg: processedSdg,
        content: data.content || '',
        images: processedImages,
        status: data.status || 'draft'
      });

      setIsFormReady(true);
    }
  }, [highlightData, reset]);

  // Form submission handler
  const onFinishHandler = async (data: HighlightsFormValues) => {
    try {
      await onFinish(data);
      navigate('/highlights');
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Loading state
  if (isDataLoading || formLoading || !isFormReady) {
    console.log('Loading State:', { isDataLoading, formLoading, isFormReady });
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

  // No data state
  if (!highlightData?.data) {
    return (
      <ErrorDialog
        open={true}
        errorMessage="No highlight data found"
        onClose={() => navigate('/highlights')}
      />
    );
  }

  // Prepare form initial values
  const initialValues = {
    ...highlightData.data,
    images: processImages(highlightData.data.images),
    sdg: processSdg(highlightData.data.sdg)
  };

  // Render form
  return (
    <HighlightsForm
    type="Edit"
    initialValues={{
      ...highlightData.data,
      category: highlightData.data.category?._id || '',
      images: Array.isArray(highlightData.data.images) 
        ? highlightData.data.images 
        : [highlightData.data.images].filter(Boolean),
      sdg: Array.isArray(highlightData.data.sdg)
        ? highlightData.data.sdg
        : [highlightData.data.sdg].filter(Boolean),
      date: highlightData.data.date 
        ? new Date(highlightData.data.date).toISOString().split('T')[0] 
        : '',
      createdAt: highlightData.data.createdAt
        ? new Date(highlightData.data.createdAt).toISOString().split('T')[0]
        : ''
    }}
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