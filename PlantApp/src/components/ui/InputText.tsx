import React from 'react';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';

import {
  InputTextBaseProps,
  InputTextField,
  InputTextFieldProps,
} from './InputTextField';

export type { InputTextBaseProps, InputTextFieldProps };
export { InputTextField };

type InputTextRHFProps<TFieldValues extends FieldValues> = Omit<
  InputTextBaseProps,
  'value' | 'onChangeText' | 'onBlur'
> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
};

type InputTextDirectProps = InputTextBaseProps & {
  value: string;
};

export function InputText<TFieldValues extends FieldValues>(
  props: InputTextRHFProps<TFieldValues> | InputTextDirectProps,
) {
  if ('control' in props && 'name' in props) {
    const { control, name, rules, ...inputProps } = props;
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState }) => (
          <InputTextField
            {...(inputProps as InputTextBaseProps)}
            value={field.value == null ? '' : String(field.value)}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
    );
  }

  return <InputTextField {...props} />;
}

// Backwards-compat alias
export const RHFInputText = InputText;
