import { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import PostCard from '../components/PostCard';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch posts whenever page, search, sortBy, or sortOrder changes
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortOrder, page]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await postsAPI.getAllPosts({
        page,
        limit: 20,
        title: search,
        sortBy,
        sortOrder,
      });
      // Handle both response shapes: { data: { posts, meta } } or { data: [] }
      const data = response.data;
      const fetchedPosts = data?.posts || (Array.isArray(data) ? data : []);
      const pages = data?.meta?.pages || 1;
      setPosts(fetchedPosts);
      setTotalPages(pages);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when search/sort options change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Explore Posts</h1>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <input
          type="text" value={search} onChange={handleSearchChange}
          placeholder="Search posts..."
          className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          aria-label="Search posts"
        />
        <div className="flex gap-2">
          <select
            value={sortBy} onChange={handleSortByChange}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            aria-label="Sort by"
          >
            <option value="createdAt">Date</option>
            <option value="like_count">Likes</option>
            <option value="comment_count">Comments</option>
          </select>
          <button
            onClick={handleSortOrderToggle}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 text-sm"
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error banner */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchPosts}
            className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Post list */}
      {!loading && !error && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No posts found.</p>
              {search && (
                <p className="text-gray-400 mt-2 text-sm">
                  Try a different search term or clear the search.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              {page > 1 ? (
                <button
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  ← Previous
                </button>
              ) : (
                <div />
              )}

              <span className="text-gray-600 text-sm font-medium">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Next →
                </button>
              ) : (
                <div />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
