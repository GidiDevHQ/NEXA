import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../contexts/useAuth';
import CommentsSection from '../components/CommentsSection';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const fetchPost = async () => {
    try {
      const response = await postsAPI.getPost(id);
      // backend returns { post }
      const postData = response.data.post || response.data;
      setPost(postData);
      setIsLiked(postData.likes?.some(likeId => likeId.toString() === user?._id) || false);
    } catch {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id, user?._id]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await postsAPI.unlikePost(id);
        setPost(prev => ({
          ...prev,
          likes: (prev.likes || []).filter(likeId => likeId.toString() !== user._id),
          like_count: prev.like_count - 1,
        }));
      } else {
        await postsAPI.likePost(id);
        setPost(prev => ({
          ...prev,
          likes: [...(prev.likes || []), user._id],
          like_count: (prev.like_count || 0) + 1,
        }));
      }
      setIsLiked(!isLiked);
    } catch {
      console.error('Error toggling like');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(id);
        navigate('/');
      } catch {
        setError('Failed to delete post');
      }
    }
  };

  const handlePublish = async () => {
    try {
      if (post.state === 'published') {
        await postsAPI.unpublishPost(id);
        setPost(prev => ({ ...prev, state: 'draft' }));
      } else {
        await postsAPI.publishPost(id);
        setPost(prev => ({ ...prev, state: 'published' }));
      }
    } catch {
      setError('Failed to update post status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  const isAuthor = user && post.author?._id?.toString() === user._id?.toString();
  const isPublished = post.state === 'published';

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 flex-shrink-0">
              {post.author?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <Link
                to={`/users/${post.author?._id}`}
                className="font-semibold text-gray-900 hover:text-blue-600 text-sm sm:text-base"
              >
                {post.author?.username || 'Unknown'}
              </Link>
              <p className="text-xs sm:text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {isAuthor && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePublish}
                className={`px-3 py-1 rounded text-sm ${
                  isPublished
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <Link
                to={`/create-post?edit=${post._id}`}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">{post.title}</h1>

        <div className="prose max-w-none mb-6 sm:mb-8">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
            {post.content}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-200">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span className="font-medium">{post.like_count || 0} likes</span>
          </button>

          <div className="text-xs sm:text-sm text-gray-500">
            {isPublished ? 'Published' : 'Draft'}
          </div>
        </div>
      </div>

      <CommentsSection postId={id} />

      <div className="mt-6 sm:mt-8">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
        >
          ← Back to Feed
        </button>
      </div>
    </div>
  );
};

export default PostDetail;
