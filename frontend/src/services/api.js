import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signUp: (userData) => api.post('/auth/signup', userData),
  signIn: (credentials) => api.post('/auth/signin', credentials),
};

// Posts API
export const postsAPI = {
  getAllPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (postData) => api.post('/posts', postData),
  updatePost: (id, postData) => api.patch(`/posts/${id}`, postData),
  deletePost: (id) => api.delete(`/posts/${id}`),
  publishPost: (id) => api.post(`/posts/${id}/publish`),
  unpublishPost: (id) => api.post(`/posts/${id}/unpublish`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  unlikePost: (id) => api.delete(`/posts/${id}/unlike`),
  getFeed: () => api.get('/posts/feed'),
};

// Users API
export const usersAPI = {
  getMyProfile: () => api.get('/users/me'),
  getMyPosts: () => api.get('/users/me/posts'),
  updateMyProfile: (userData) => api.put('/users/me', userData),
  deleteMyProfile: () => api.delete('/users/me'),
  getUserProfile: (userId) => api.get(`/users/${userId}`),
  getUserPosts: (userId) => api.get(`/users/${userId}/posts`),
  followUser: (userId) => api.post(`/users/follow/${userId}`),
  unfollowUser: (userId) => api.post(`/users/unfollow/${userId}`),
  getFollowing: () => api.get('/users/following'),
  getFollowers: () => api.get('/users/followers'),
};

// Comments API
export const commentsAPI = {
  getComments: (postId) => api.get(`/comments/posts/${postId}`),
  getReplies: (commentId) => api.get(`/comments/${commentId}/replies`),
  createComment: (postId, commentData) => api.post(`/comments/posts/${postId}`, commentData),
  createReply: (commentId, replyData) => api.post(`/comments/${commentId}/replies`, replyData),
  updateComment: (commentId, commentData) => api.patch(`/comments/${commentId}`, commentData),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
  unlikeComment: (commentId) => api.delete(`/comments/${commentId}/unlike`),
};

export default api;