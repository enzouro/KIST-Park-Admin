import React from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useGetIdentity, useOne } from '@pankod/refine-core';
import { useForm } from '@pankod/refine-react-hook-form';

import LoadingDialog from 'components/common/LoadingDialog';
import ErrorDialog from 'components/common/ErrorDialog';
import PressReleaseForm from 'components/press-release/PressReleaseForm';
import { PressReleaseFormValues } from 'interfaces/forms';

const EditPressRelease = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: user } = useGetIdentity();

  const { data: pressReleaseData, isLoading: fetchLoading, isError } = useOne({
    resource: "press-release",
    id: id as string,
  });

  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm<PressReleaseFormValues>({
    refineCoreProps: {
      resource: "press-release",
      action: "edit",
      id: id,
      redirect: false,
    },
    defaultValues: {
      seq: pressReleaseData?.data.seq || 0,
      title: pressReleaseData?.data.title || '',
      publisher: pressReleaseData?.data.publisher || '',
      date: pressReleaseData?.data.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      link: pressReleaseData?.data.link || '',
      image: pressReleaseData?.data.image || '',
      createdAt: pressReleaseData?.data.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    }
  });

  React.useEffect(() => {
    if (pressReleaseData?.data) {
      reset(pressReleaseData.data);
    }
  }, [pressReleaseData, reset]);

  const onFinishHandler = async (data: PressReleaseFormValues) => {
      if (!data.image) {
        throw new Error('Image is required');
      }
      await onFinish({
        ...data,
        createdAt: pressReleaseData?.data.createdAt || new Date().toISOString(),
      });
      navigate('/press-release');
  };

  if (fetchLoading || formLoading) {
    return (
      <LoadingDialog  
        open={true}
        loadingMessage="Loading Press Release data..."
      />
    );
  }

  if (isError) {
    return (
      <ErrorDialog
        open={true}
        errorMessage="Error loading press release data"
        onClose={() => navigate('/press-release')}
      />
    );
  }

  return (
    <PressReleaseForm
      type="Edit"
      register={register}
      control={control}
      handleSubmit={handleSubmit}
      onFinishHandler={onFinishHandler}
      errors={errors}
      user={user}
      initialValues={pressReleaseData?.data}
    />
  );
};

export default EditPressRelease;