import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { MessageCircle, Send, Edit2, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskCommentsApi } from '../services/api';

const TaskComments = ({ taskId, currentUserId = 1 }) => {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery(
    ['taskComments', taskId],
    () => taskCommentsApi.getByTaskId(taskId).then(res => res.data),
    {
      enabled: !!taskId,
    }
  );

  const createCommentMutation = useMutation(
    (data) => taskCommentsApi.create(taskId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taskComments', taskId]);
        queryClient.invalidateQueries(['taskActivities', taskId]);
        setNewComment('');
        toast.success('Comment added successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add comment');
      },
    }
  );

  const updateCommentMutation = useMutation(
    ({ commentId, data }) => taskCommentsApi.update(taskId, commentId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taskComments', taskId]);
        setEditingComment(null);
        setEditContent('');
        toast.success('Comment updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update comment');
      },
    }
  );

  const deleteCommentMutation = useMutation(
    (commentId) => taskCommentsApi.delete(taskId, commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taskComments', taskId]);
        toast.success('Comment deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete comment');
      },
    }
  );

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment,
      userId: currentUserId,
    });
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    updateCommentMutation.mutate({
      commentId: editingComment,
      data: { content: editContent },
    });
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy \'at\' h:mm a');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Failed to load comments
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={20} className="text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments?.length || 0})
        </h3>
      </div>

      {/* Add new comment */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || createCommentMutation.isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            {createCommentMutation.isLoading ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.userName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  {comment.userId === currentUserId && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditComment(comment)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                {editingComment === comment.id ? (
                  <form onSubmit={handleUpdateComment} className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!editContent.trim() || updateCommentMutation.isLoading}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updateCommentMutation.isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                        }}
                        className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {comments?.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to add one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskComments;
