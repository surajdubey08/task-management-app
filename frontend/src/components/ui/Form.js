import React, { forwardRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

// Form Context Provider
export const Form = ({ children, ...props }) => {
  return <FormProvider {...props}>{children}</FormProvider>;
};

// Form Field wrapper
export const FormField = ({ name, children }) => {
  const { formState: { errors } } = useForm();
  const error = errors[name];

  return (
    <div className="space-y-2">
      {typeof children === 'function' 
        ? children({ error }) 
        : React.cloneElement(children, { error })
      }
    </div>
  );
};

// Form Item wrapper
export const FormItem = ({ className, ...props }) => {
  return <div className={cn('space-y-2', className)} {...props} />;
};

// Form Label
export const FormLabel = ({ className, required = false, ...props }) => {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-gray-700 dark:text-gray-300',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {props.children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

// Input component
export const Input = forwardRef(({ 
  className, 
  type = 'text', 
  error, 
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      )}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
          'dark:focus:ring-blue-400 dark:focus:border-blue-400',
          Icon && 'pl-10',
          RightIcon && 'pr-10',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        ref={ref}
        {...props}
      />
      {RightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <RightIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Password Input
export const PasswordInput = forwardRef(({ ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Input
      {...props}
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={showPassword ? EyeOff : Eye}
      onRightIconClick={() => setShowPassword(!showPassword)}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

// Textarea component
export const Textarea = forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
        'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
        'dark:focus:ring-blue-400 dark:focus:border-blue-400',
        error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

// Select component
export const Select = forwardRef(({ 
  className, 
  error, 
  options = [], 
  placeholder = 'Select an option...',
  ...props 
}, ref) => {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-white',
        'dark:focus:ring-blue-400 dark:focus:border-blue-400',
        error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
        className
      )}
      ref={ref}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

Select.displayName = 'Select';

// Checkbox component
export const Checkbox = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
        'dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-400',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Checkbox.displayName = 'Checkbox';

// Radio component
export const Radio = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type="radio"
      className={cn(
        'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
        'dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-400',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Radio.displayName = 'Radio';

// Form Error Message
export const FormMessage = ({ children, className, error, ...props }) => {
  const body = error?.message || children;

  if (!body) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-red-600 dark:text-red-400',
        className
      )}
      {...props}
    >
      <AlertCircle className="h-4 w-4" />
      {body}
    </div>
  );
};

// Form Description
export const FormDescription = ({ className, ...props }) => {
  return (
    <p
      className={cn(
        'text-sm text-gray-500 dark:text-gray-400',
        className
      )}
      {...props}
    />
  );
};

// Enhanced Form Hook
export const useEnhancedForm = ({ 
  schema, 
  defaultValues, 
  onSubmit, 
  onError,
  mode = 'onChange'
}) => {
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
  });

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        await onSubmit(data);
      } catch (error) {
        console.error('Form submission error:', error);
        if (onError) {
          onError(error);
        }
      }
    },
    (errors) => {
      console.error('Form validation errors:', errors);
      if (onError) {
        onError(errors);
      }
    }
  );

  return {
    ...form,
    handleSubmit,
  };
};

// Form Grid Layout
export const FormGrid = ({ columns = 1, className, ...props }) => {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
      {...props}
    />
  );
};

// Form Actions
export const FormActions = ({ 
  children, 
  className, 
  isSubmitting = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  showCancel = true,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      )}
      
      {children || (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            submitText
          )}
        </Button>
      )}
    </div>
  );
};
