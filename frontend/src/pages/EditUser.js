import React from 'react';
import { useQuery, useMutation } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { usersApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: user, isLoading } = useQuery(
    ['user', id],
    () => usersApi.getById(id).then(res => res.data),
    {
      enabled: !!id,
      onSuccess: (data) => {
        reset({
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber || '',
          department: data.department || '',
        });
      },
    }
  );

  const updateUserMutation = useMutation(
    (data) => usersApi.update(id, data),
    {
      onSuccess: () => {
        toast.success('User updated successfully');
        navigate('/users');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      },
    }
  );

  const onSubmit = (data) => {
    updateUserMutation.mutate(data);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading user data..." />;
  }

  if (!user) {
    return <ErrorMessage message="User not found" />;
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
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
              disabled={updateUserMutation.isLoading}
              className="btn btn-primary"
            >
              <Save size={20} />
              {updateUserMutation.isLoading ? 'Updating...' : 'Update User'}
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

export default EditUser;
