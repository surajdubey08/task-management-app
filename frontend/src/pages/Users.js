import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Users = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error, refetch } = useQuery(
    'users',
    () => usersApi.getAll().then(res => res.data)
  );

  const deleteUserMutation = useMutation(
    (userId) => usersApi.delete(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      },
    }
  );

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete all their tasks.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load users" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link to="/users/new" className="btn btn-primary">
          <Plus size={20} />
          New User
        </Link>
      </div>

      {users && users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/users/${user.id}/edit`}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
                
                {user.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                
                {user.department && (
                  <div className="flex items-center gap-2">
                    <Building size={16} />
                    <span>{user.department}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                  <Link 
                    to={`/tasks?userId=${user.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Tasks
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first user.</p>
          <Link to="/users/new" className="btn btn-primary">
            <Plus size={20} />
            Create User
          </Link>
        </div>
      )}
    </div>
  );
};

export default Users;
