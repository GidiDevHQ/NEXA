import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { postsAPI } from '../services/api';

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    publish: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    if (editId) {
      postsAPI.getPost(editId)
        .then(response => {
          const post = response.data.post || response.data;
          setFormData({
            title: post.title,
            content: post.content,
            tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
            publish: post.state === 'published',
          });
        })
        .catch(() => {
          setError('Failed to load post for editing');
        });
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const parseTags = (raw) => raw.split(',').map(t => t.trim()).filter(t => t.length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      title: formData.title,
      content: formData.content,
      tags: parseTags(formData.tags),
      ...(formData.publish && { state: 'published' }),
    };

    try {
      if (editId) {
        await postsAPI.updatePost(editId, payload);
        navigate(`/posts/${editId}`);
      } else {
        const response = await postsAPI.createPost(payload);
        const newId = response.data.post?._id || response.data._id;
        navigate(formData.publish ? `/posts/${newId}` : '/profile');
      }
    } catch (error) {
      setError(error.response?.data?.message || (editId ? 'Failed to update post' : 'Failed to create post'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-0">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
          {editId ? 'Edit Post' : 'Create New Post'}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
            <input
              type="text" id="title" name="title" value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter your post title" required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">Content</label>
            <textarea
              id="content" name="content" value={formData.content}
              onChange={handleChange} rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Write your post content here..." required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">
              Tags <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text" id="tags" name="tags" value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="e.g. react, javascript, webdev"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox" name="publish" checked={formData.publish}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm font-medium">Publish immediately</span>
            </label>
            <div className="flex space-x-3">
              <button
                type="button" onClick={() => navigate('/')}
                className="flex-1 sm:flex-none px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={loading}
                className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
              >
                {loading ? (editId ? 'Saving...' : 'Creating...') : (editId ? 'Save Changes' : 'Create Post')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
