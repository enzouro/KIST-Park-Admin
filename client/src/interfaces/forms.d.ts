import { ReactNode } from 'react';

export interface HighlightsFormProps{
  type: string,
  register: any,
  control,
  onFinish: (values: FieldValues) => Promise<void | CreateResponse<BaseRecord> | UpdateResponse<BaseRecord>>,
  formLoading: boolean,
  handleSubmit: FormEventHandler<HTMLFormElement> | undefined,
  onFinishHandler: (data: FieldValues) => Promise<void>,
  initialValues?: Record<string, any>;

}