import React from 'react';
import { useNavigate } from "react-router-dom";
import { useGetIdentity } from '@pankod/refine-core';
import { useForm } from '@pankod/refine-react-hook-form';

import LoadingDialog from 'components/common/LoadingDialog';
import ErrorDialog from 'components/common/ErrorDialog';
import HighlightsForm from 'components/highlights/HighlightsForm';
import { HighlightsFormValues } from 'interfaces/forms';

const CreateHighlights = () => {
  const navigate = useNavigate();
  const { data: user } = useGetIdentity();
  
  // Use the typed useForm with explicitly typed methods
  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<HighlightsFormValues>({
    refineCoreProps: {
      resource: "highlights",
      action: "create",
      redirect: false,
    },
    defaultValues: {
      seq: '',
      createdAt: '',
      title: '',
      date: '',
      location: '',
      category: '',
      sdg: [], 
      content: '',
      images: [],
      status: 'draft'
    }
  });

  const onFinishHandler = async (data: HighlightsFormValues) => {
    await onFinish(data);
    navigate('/highlights');
  };

  // Show loading dialog if form is loading
  if (formLoading) {
    return (
      <LoadingDialog
        open={true}
        loadingMessage="Loading Highlights form..."
      />
    );
  }

  return (
    <HighlightsForm
      type="Create"
      register={register}
      control={control}
      handleSubmit={handleSubmit}
      onFinishHandler={onFinishHandler}
      errors={errors}
      user={user}
    />
  );
};

export default CreateHighlights;