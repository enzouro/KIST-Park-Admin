// src/pages/create-sale.tsx
import React from 'react';
import { useNavigate } from "react-router-dom";

import LoadingDialog from 'components/common/LoadingDialog';
import ErrorDialog from 'components/common/ErrorDialog';
import HighlightsForm from 'components/forms/HighlightsForm';
import { useGetIdentity } from '@pankod/refine-core';
import { FieldValues, useForm } from '@pankod/refine-react-hook-form';



const CreateHighlights = () => {
  const navigate = useNavigate();
  const { data: user } = useGetIdentity();
  const isError = false;


  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
  } = useForm();

  const onFinishHandler = async (data: FieldValues) => {
    await onFinish({
      ...data,
      email: user.email,
    });
    navigate('/highlights');
  };

  if (formLoading) {
    return (
      <LoadingDialog 
        open={formLoading}
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
    <HighlightsForm
      type="Create"
      control
      register={register}
      onFinish={onFinish}
      formLoading={formLoading}
      handleSubmit={handleSubmit}
      onFinishHandler={onFinishHandler}
    />
  );
};

export default CreateHighlights;

