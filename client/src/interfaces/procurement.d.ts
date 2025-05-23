import { BaseKey } from '@pankod/refine-core';

export interface FormFieldProp {
  title: string,
  labelName: string
}

export interface FormValues {
    title: string,
    description: string,
    procurementType: string,
    location: string,
    price: number | undefined,
}

export interface ProcurementCardProps {
  id?: BaseKey | undefined,
  title: string,
  location: string,
  price: string,
  procurementType?: string;
}
