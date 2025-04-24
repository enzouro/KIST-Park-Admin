import React from 'react';
import { useNavigate } from "react-router-dom";
import { useGetIdentity } from '@pankod/refine-core';
import { useForm } from '@pankod/refine-react-hook-form';

import LoadingDialog from 'components/common/LoadingDialog';
import ErrorDialog from 'components/common/ErrorDialog';
import PressReleaseForm from 'components/press-release/PressReleaseForm';
import { PressReleaseFormValues } from 'interfaces/forms';

const CreatePressRelease = () => {
  const navigate = useNavigate();
  const { data: user } = useGetIdentity();
  
  // ...existing code...
  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<PressReleaseFormValues>({
    refineCoreProps: {
      resource: "press-release",
      action: "create",
      redirect: false,
    },
    defaultValues: {
      seq: 0,
      createdAt: new Date().toISOString().split('T')[0],
      title: '',
      publisher: '',
      date: new Date().toISOString().split('T')[0],
      link: '',
      image: ''
    }
  });

  const onFinishHandler = async (data: PressReleaseFormValues) => {
      if (!data.image) {
        throw new Error('Image is required');
      }
      await onFinish({
        ...data,
        createdAt: new Date().toISOString(),
      });
      navigate('/press-release');
    }

  if (formLoading) {
    return (
      <LoadingDialog  
        open={true}
        loadingMessage="Loading Press Release form..."
      />
    );
  }

  return (
    <PressReleaseForm
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

export default CreatePressRelease;