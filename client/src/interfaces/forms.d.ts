import { FieldErrors, UseFormHandleSubmit, Control, UseFormRegister } from 'react-hook-form';
import { CreateResponse, UpdateResponse } from '@pankod/refine-react-hook-form';
import { ReactNode } from 'react';

export interface PressReleaseFormValues {
  seq: number;
  title: string;
  publisher: string;
  date: string;
  image: string;
  link: string;
  createdAt: string;
}

export interface HighlightsFormValues {
  seq: number;
  createdAt: string;
  title: string;
  date: string;
  location: string;
  category: string; // Add category field
  sdg: string[] | string;
  content: string;
  images: any[]; // Array of image URLs or objects
  status: 'draft' | 'published' | 'rejected';
  email?: string;
}

export interface HighlightsFormProps {
  type: 'Create' | 'Edit'; // The component expects 'type' prop
  initialValues?: any; // The form's initial values
  onFinishHandler: (data: HighlightsFormValues) => Promise<void>;
  handleSubmit: UseFormHandleSubmit<any>;
  register: UseFormRegister<any>;
  control: Control<any>;
  errors: FieldErrors<any>;
  user: any; // The user object from useGetIdentity
}

export interface PressReleaseFormProps {
  type: 'Create' | 'Edit'; // The component expects 'type' prop
  initialValues?: any; // The form's initial values
  onFinishHandler: (data: PressReleaseFormValues) => Promise<void>;
  handleSubmit: UseFormHandleSubmit<any>;
  register: UseFormRegister<any>;
  control: Control<any>;
  errors: FieldErrors<any>;
  user: any; // The user object from useGetIdentity
}

export interface CustomButtonProps {
  type?: string,
  title: string,
  backgroundColor: string,
  color: string,
  fullWidth?: boolean,
  icon?: ReactNode,
  disabled?: boolean,
  handleClick?: () => void
}