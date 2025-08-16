
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Categories = () => {
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error, refetch } = useQuery(
    'categories',
    async () => {
      const response = await categoriesApi.getAll();
      return response.data;
    }
  );

  const deleteCategoryMutation = useMutation(
    (categoryId) => categoriesApi.delete(categoryId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Category deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      },
    }
  );

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Tasks using this category will have their category removed.')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load categories" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link to="/categories/new" className="btn btn-primary">
          <Plus size={20} />
          New Category
        </Link>
      </div>

      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${category.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/categories/${category.id}/edit`}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
              )}

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
                  <Link 
                    to={`/tasks?categoryId=${category.id}`}
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
          <Tag className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first category.</p>
          <Link to="/categories/new" className="btn btn-primary">
            <Plus size={20} />
            Create Category
          </Link>
        </div>
      )}
    </div>
  );
};

export default Categories;
