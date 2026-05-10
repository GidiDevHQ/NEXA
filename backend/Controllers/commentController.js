import mongoose from 'mongoose';
import Comment from '../Models/Comment.js';
import Post from '../Models/Post.js';
import User from '../Models/User.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all top-level comments for a post
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get all replies for a comment
export const getReplies = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    
    // Verify comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const replies = await Comment.find({ parentComment: commentId })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: replies,
      count: replies.length,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new comment
export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Validation
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create comment
    const comment = new Comment({
      content: content.trim(),
      author: userId,
      post: postId,
      parentComment: null,
    });

    await comment.save();

    // Update post comment count
    post.comment_count = (post.comment_count || 0) + 1;
    await post.save();

    // Populate author info
    await comment.populate('author', 'username avatarUrl');

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Create a reply to a comment
export const createReply = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    // Validation
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    // Verify parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Create reply
    const reply = new Comment({
      content: content.trim(),
      author: userId,
      post: parentComment.post,
      parentComment: commentId,
    });

    await reply.save();

    // Populate author info
    await reply.populate('author', 'username avatarUrl');

    res.status(201).json({
      success: true,
      data: reply,
      message: 'Reply created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update a comment
export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validation
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    // Update comment
    comment.content = content.trim();
    await comment.save();

    await comment.populate('author', 'username avatarUrl');

    res.status(200).json({
      success: true,
      data: comment,
      message: 'Comment updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete a comment
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author or post author
    const post = await Post.findById(comment.post);
    if (comment.author.toString() !== userId.toString() && post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments or comments on your posts' });
    }

    // Delete comment
    await Comment.findByIdAndDelete(commentId);

    // Update post comment count
    post.comment_count = Math.max(0, (post.comment_count || 1) - 1);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Like a comment
export const likeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already liked
    if (comment.likes.includes(userId)) {
      return res.status(400).json({ message: 'You have already liked this comment' });
    }

    comment.likes.push(userId);
    await comment.save();

    await comment.populate('author', 'username avatarUrl');

    res.status(200).json({
      success: true,
      data: comment,
      message: 'Comment liked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Unlike a comment
export const unlikeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user has liked
    if (!comment.likes.includes(userId)) {
      return res.status(400).json({ message: 'You have not liked this comment' });
    }

    comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
    await comment.save();

    await comment.populate('author', 'username avatarUrl');

    res.status(200).json({
      success: true,
      data: comment,
      message: 'Comment unliked successfully',
    });
  } catch (error) {
    next(error);
  }
};
