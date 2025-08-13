import React from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { categoriesApi } from '../services/api';

const CreateCategory = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      color: '#007bff',
      isActive: true,
    }
  });

  const createCategoryMutation = useMutation(
    (data) => categoriesApi.create(data),
    {
      onSuccess: () => {
        toast.success('Category created successfully');
        navigate('/categories');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create category');
      },
    }
  );

  const onSubmit = (data) => {
    createCategoryMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/categories')}
          className="btn btn-outline"
        >
          <ArrowLeft size={20} />
          Back to Categories
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Category</h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Color</label>
              <input
                type="color"
                className="form-input h-10"
                {...register('color')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="rounded"
                />
                <span className="form-label mb-0">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={createCategoryMutation.isLoading}
              className="btn btn-primary"
            >
              <Save size={20} />
              {createCategoryMutation.isLoading ? 'Creating...' : 'Create Category'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/categories')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCategory;
