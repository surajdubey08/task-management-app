import React from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { usersApi } from '../services/api';

const CreateUser = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const createUserMutation = useMutation(
    (data) => usersApi.create(data),
    {
      onSuccess: () => {
        toast.success('User created successfully');
        navigate('/users');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      },
    }
  );

  const onSubmit = (data) => {
    createUserMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/users')}
          className="btn btn-outline"
        >
          <ArrowLeft size={20} />
          Back to Users
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
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
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                {...register('phoneNumber')}
              />
            </div>

            <div>
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-input"
                {...register('department')}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={createUserMutation.isLoading}
              className="btn btn-primary"
            >
              <Save size={20} />
              {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/users')}
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

export default CreateUser;
