import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI, postsAPI } from '../services/api';
import { useAuth } from '../contexts/useAuth';
import UserListModal from '../components/UserListModal';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [postFilter, setPostFilter] = useState('all');

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    if (isOwnProfile) {
      fetchMyProfile();
    } else {
      fetchUserProfile();
    }
  }, [userId, isOwnProfile]);

  const extractUser = (data) => data?.user || data;
  const extractPosts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.posts)) return data.posts;
    return [];
  };
  const getCount = (key) => profileUser?.[`${key}Count`] ?? profileUser?.[key]?.length ?? 0;

  const fetchMyProfile = async () => {
    try {
      const [profileResponse, postsResponse] = await Promise.all([
        usersAPI.getMyProfile(),
        usersAPI.getMyPosts(),
      ]);
      setProfileUser(extractUser(profileResponse.data));
      setPosts(extractPosts(postsResponse.data));
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const [profileResponse, postsResponse, followingResponse] = await Promise.all([
        usersAPI.getUserProfile(userId),
        usersAPI.getUserPosts(userId),
        currentUser ? usersAPI.getFollowing().catch(() => null) : Promise.resolve(null),
      ]);
      const userData = extractUser(profileResponse.data);
      setProfileUser(userData);
      setPosts(extractPosts(postsResponse.data));

      // Check isFollowing from the current user's following list
      if (followingResponse) {
        const followingList = followingResponse.data?.following ||
          followingResponse.data?.users ||
          followingResponse.data || [];
        const alreadyFollowing = Array.isArray(followingList)
          ? followingList.some(u => {
              const id = typeof u === 'string' ? u : u?._id;
              return id?.toString() === userId?.toString();
            })
          : false;
        setIsFollowing(alreadyFollowing);
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishPost = async (postId) => {
    try {
      await postsAPI.publishPost(postId);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, state: 'published' } : p
      ));
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  };

  const openModal = async (type) => {
    setModalType(type);
    setModalLoading(true);
    setModalError('');
    try {
      let users = [];
      if (isOwnProfile) {
        const res = type === 'followers'
          ? await usersAPI.getFollowers()
          : await usersAPI.getFollowing();
        users = res.data?.users || res.data?.followers || res.data?.following || res.data || [];
      } else {
        users = type === 'followers'
          ? (profileUser.followers || [])
          : (profileUser.following || []);
      }
      setModalUsers(users);
      setModalLoading(false);
    } catch (err) {
      setModalError('Failed to load users');
      setModalLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await usersAPI.unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await usersAPI.followUser(userId);
        setIsFollowing(true);
      }
      // Re-fetch profile to get accurate follower counts
      fetchUserProfile();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const filteredPosts = posts.filter(p => postFilter === 'all' ? true : p.state === postFilter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mr-4 sm:mr-6 flex-shrink-0">
              {(profileUser.username || profileUser.first_name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                {profileUser.first_name && profileUser.last_name
                  ? `${profileUser.first_name} ${profileUser.last_name}`
                  : profileUser.username || 'User'}
              </h1>
              <p className="text-gray-500 text-sm mb-1">@{profileUser.username}</p>
              <p className="text-gray-600 text-sm mb-3 sm:mb-4">{profileUser.email}</p>
              <div className="flex flex-wrap gap-3 sm:gap-6 text-sm text-gray-500">
                <span>{posts.length} posts</span>
                <button onClick={() => openModal('followers')} className="hover:underline">{getCount('followers')} followers</button>
                <button onClick={() => openModal('following')} className="hover:underline">{getCount('following')} following</button>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              onClick={handleFollow}
              className={`self-start sm:self-auto px-5 py-2 rounded-lg font-medium text-sm ${
                isFollowing
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {profileUser.bio && (
          <div className="mt-4 sm:mt-6">
            <p className="text-gray-700 text-sm sm:text-base">{profileUser.bio}</p>
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          {isOwnProfile ? 'My Posts' : `${profileUser.username || profileUser.first_name}'s Posts`}
        </h2>

        {isOwnProfile && (
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {[
              { label: 'All', value: 'all' },
              { label: 'Draft', value: 'draft' },
              { label: 'Published', value: 'published' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPostFilter(value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  postFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4 text-sm sm:text-base">
              {isOwnProfile ? "You haven't created any posts yet." : 'No posts yet.'}
            </p>
            {isOwnProfile && (
              <Link
                to="/create-post"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block text-sm sm:text-base"
              >
                Create Your First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredPosts.map((post) => (
              <div key={post._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/posts/${post._id}`}
                      className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 block truncate"
                    >
                      {post.title}
                    </Link>
                    <p className="text-gray-600 mt-1 line-clamp-2 text-sm">
                      {post.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>{post.like_count || 0} likes</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        post.state === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.state === 'published' ? 'Published' : 'Draft'}
                      </span>
                      {isOwnProfile && post.state !== 'published' && (
                        <button
                          onClick={() => handlePublishPost(post._id)}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserListModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === 'followers' ? 'Followers' : 'Following'}
        users={modalUsers}
        loading={modalLoading}
        error={modalError}
      />
    </div>
  );
};

export default Profile;