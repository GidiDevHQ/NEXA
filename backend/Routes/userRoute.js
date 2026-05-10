import express from 'express';
import authMiddleware from '../Middlewares/authMiddleware.js';
import{
    getMyProfile,
    getMyPosts,
    updateMyProfile,
    deleteMyProfile,
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    getUserProfile,
    getUserPosts,
} from '../Controllers/userController.js';

const router = express.Router();

// Protected routes (require authentication) - specific routes first
router.get('/me', authMiddleware, getMyProfile); // Get my profile
router.get('/me/posts', authMiddleware, getMyPosts); // Get my posts
router.put('/me', authMiddleware, updateMyProfile); // Update my profile
router.delete('/me', authMiddleware, deleteMyProfile); // Delete my profile
router.post('/follow/:userId', authMiddleware, followUser); // Follow a user
router.post('/unfollow/:userId', authMiddleware, unfollowUser); // Unfollow a user
router.get('/following', authMiddleware, getFollowing); // Get list of users I'm following
router.get('/followers', authMiddleware, getFollowers); // Get list of users following me

// Public routes (no authentication required)
router.get('/:userId', getUserProfile); // Get another user's profile
router.get('/:userId/posts', getUserPosts); // Get another user's posts

export default router;