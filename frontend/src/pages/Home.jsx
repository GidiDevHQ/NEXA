import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../contexts/useAuth';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const extractPosts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.posts)) return data.posts;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchFeed = useCallback(async () => {
    try {
      const response = user ? await postsAPI.getFeed() : await postsAPI.getAllPosts();
      setPosts(extractPosts(response.data));
    } catch (error) {
      console.error('Error fetching feed:', error);
      try {
        const response = await postsAPI.getAllPosts();
        setPosts(extractPosts(response.data));
      } catch {
        setError('Failed to load posts');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      await fetchFeed();
    };
    load();
  }, [fetchFeed]);

  const handleLike = async (postId) => {
    try {
      await postsAPI.likePost(postId);
      // Update the post in the local state
      setPosts(posts.map(post =>
        post._id === postId
          ? { ...post, likes: [...(post.likes || []), user._id] }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUnlike = async (postId) => {
    try {
      await postsAPI.unlikePost(postId);
      // Update the post in the local state
      setPosts(posts.map(post =>
        post._id === postId
          ? { ...post, likes: (post.likes || []).filter(id => id !== user._id) }
          : post
      ));
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchFeed}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Feed</h1>
        <p className="text-gray-600 text-sm sm:text-base">See what your friends are posting</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No posts yet. Be the first to share something!</p>
          <Link
            to="/create-post"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                    {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <Link
                      to={`/users/${post.author?._id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 text-sm sm:text-base"
                    >
                      {post.author?.username || 'Unknown User'}
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <Link to={`/posts/${post._id}`}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                  {post.title}
                </h3>
              </Link>

              <p className="text-gray-700 mb-4 line-clamp-3 text-sm sm:text-base">
                {post.content}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => post.likes?.includes(user?._id) ? handleUnlike(post._id) : handleLike(post._id)}
                    className={`flex items-center space-x-1 ${
                      post.likes?.includes(user?._id) ? 'text-red-600' : 'text-gray-600'
                    } hover:text-red-600`}
                  >
                    <span>❤️</span>
                    <span className="text-sm">{post.likes?.length || 0}</span>
                  </button>
                </div>

                <Link
                  to={`/posts/${post._id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Read more →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;