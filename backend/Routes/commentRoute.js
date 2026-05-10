import express from 'express';
import authMiddleware from '../Middlewares/authMiddleware.js';
import {
  getComments,
  getReplies,
  createComment,
  createReply,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from '../Controllers/commentController.js';

const router = express.Router();

// Get all comments for a post (public)
router.get('/posts/:postId', getComments);

// Get all replies for a comment (public)
router.get('/:commentId/replies', getReplies);

// Create a comment (protected)
router.post('/posts/:postId', authMiddleware, createComment);

// Create a reply to a comment (protected)
router.post('/:commentId/replies', authMiddleware, createReply);

// Update a comment (protected)
router.patch('/:commentId', authMiddleware, updateComment);

// Delete a comment (protected)
router.delete('/:commentId', authMiddleware, deleteComment);

// Like a comment (protected)
router.post('/:commentId/like', authMiddleware, likeComment);

// Unlike a comment (protected)
router.delete('/:commentId/unlike', authMiddleware, unlikeComment);

export default router;
