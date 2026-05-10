import express from 'express';
import authMiddleware from '../Middlewares/authMiddleware.js';
import {
    listPosts,
    getAllPosts,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    unpublishPost,
    likePost,
    unlikePost,
    feedPosts,
} from '../Controllers/postController.js';

const router = express.Router();

// Protected routes (require authentication) - specific routes first
router.get('/feed', authMiddleware, feedPosts); // Get posts from followed users
router.post('/', authMiddleware, createPost); // Create a new post
router.patch('/:id', authMiddleware, updatePost); // Update a post by ID
router.delete('/:id', authMiddleware, deletePost); // Delete a post by ID
router.post('/:id/publish', authMiddleware, publishPost); // Publish a post
router.post('/:id/unpublish', authMiddleware, unpublishPost); // Unpublish a post
router.post('/:id/like', authMiddleware, likePost); // Like a post
router.delete('/:id/unlike', authMiddleware, unlikePost); // Unlike a post

// Public routes (no authentication required)
router.get('/', listPosts); // List published posts with search/sort/pagination
router.get('/:id', getAllPosts); // Get a specific published post by ID

export default router;