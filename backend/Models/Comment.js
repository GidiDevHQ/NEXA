import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null, // null for top-level comments, reference to parent comment for replies
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ post: 1, createdAt: -1 }); // Index for efficient retrieval of comments by post
commentSchema.index({ parentComment: 1, createdAt: -1 }); // Index for efficient retrieval of replies

export default mongoose.model('Comment', commentSchema);
