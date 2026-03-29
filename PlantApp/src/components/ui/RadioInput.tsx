import React from 'react';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';

import {
  RadioInputBaseProps,
  RadioInputField,
  RadioInputFieldProps,
  RadioValue,
} from './RadioInputField';

export type { RadioInputBaseProps, RadioInputFieldProps };
export { RadioInputField };

type RadioInputRHFProps<
  TFieldValues extends FieldValues,
  TValue extends RadioValue,
> = Omit<RadioInputBaseProps<TValue>, 'value' | 'onChange'> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
};

type RadioInputDirectProps<TValue extends RadioValue> = RadioInputBaseProps<TValue>;

export function RadioInput<
  TFieldValues extends FieldValues,
  TValue extends RadioValue,
>(props: RadioInputRHFProps<TFieldValues, TValue> | RadioInputDirectProps<TValue>) {
  if ('control' in props && 'name' in props) {
    const { control, name, rules, ...fieldProps } = props;
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState }) => (
          <RadioInputField
            {...(fieldProps as Omit<RadioInputBaseProps<TValue>, 'value' | 'onChange'>)}
            value={(field.value as TValue) ?? null}
            onChange={(next) => field.onChange(next)}
            error={fieldState.error?.message}
          />
        )}
      />
    );
  }

  return <RadioInputField {...props} />;
}

// Backwards-compat alias
export const RHFRadioInput = RadioInput;
