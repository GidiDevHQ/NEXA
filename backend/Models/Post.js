import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    state: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
    like_count: {
        type: Number,
        default: 0,
    },
    comment_count: {
        type: Number,
        default: 0,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, 
{
    timestamps: true,
}
);
postSchema.index({ author: 1, createdAt: -1 }); // Index for efficient retrieval of posts by author and creation date

export default mongoose.model('Post', postSchema);