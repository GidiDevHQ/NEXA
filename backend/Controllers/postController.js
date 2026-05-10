import mongoose from "mongoose";
import Post from "../Models/Post.js";
import User from "../Models/User.js";
import Follow from "../Models/Follow.js";

const buildSearchFilters = ({ author, title, tags}) =>{
    const filter = { state: "published" }; // Only search published posts

    if (author) {
        filter.author = author; // Filter by author ID
    }

    if (title) {
        filter.title = { $regex: title, $options: "i" }; // Filter by title (case-insensitive)
    }

    if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()); // Ensure tags is an array
        filter.tags = { $in: tagsArray }; // Filter by tags (posts that have any of the specified tags)
    }

    return filter;
};

export const listPosts = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page)) || 1; // Default to page 1
        const limit = Math.max(1, parseInt(req.query.limit)) || 10; // Default to 10 posts per page
        const skip = (page - 1) * limit;

        const filter = buildSearchFilters(req.query);

        const sortField = ["like_count", "comment_count", "createdAt"].includes(req.query.sortBy) ? req.query.sortBy : "createdAt"; // Default to sorting by creation date
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // Default to descending order

        const [posts, totalPosts] = await Promise.all([
            Post.find(filter)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit)
                .populate('author', 'first_name last_name username profilePicture'), // Populate author details
            Post.countDocuments(filter), // Get total count for pagination
        ]);

        return res.status(200).json({
            meta: {
                page,
                limit,
                total: totalPosts,
                pages: Math.ceil(totalPosts / limit),
            },
            posts,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllPosts = async (req, res, next) => {
    try {
        const post = await Post.findOne({
            _id: req.params.id,
            state: "published", // Only retrieve published posts
        }).populate('author', 'first_name last_name username profilePicture'); // Populate author details
        return res.status(200).json({ post });
    } catch (error) {
        next(error);
    }
};

export const createPost = async (req, res, next) => {
    try {
        const { title, content, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const post = await Post.create({
            title,
            content,
            tags,
            author: req.user.id, // Set the author to the authenticated user
            tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()), // Ensure tags is an array
            state: "draft", // New posts start as drafts
        });
        return res.status(201).json({ post });
    } catch (error) {
        next(error);
    }
};

export const updatePost = async (req, res, next) => {
    try {
        const post = await Post.findOne({
            _id: req.params.id,
            author: req.user.id, // Ensure the user is the author of the post
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        
        const { title, content, tags, state } = req.body;

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (tags !== undefined) post.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()); // Ensure tags is an array
        
        if (state !== undefined) {
            if (!["draft", "published", "archived"].includes(state)) {
                return res.status(400).json({ message: "Invalid state value" });
            }
            post.state = state;
        }

        await post.save();
        return res.status(200).json({ post });
    } catch (error) {
        next(error);
    }
};

export const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            author: req.user.id, // Ensure the user is the author of the post
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const publishPost = async (req, res, next) => {
    try {
        const post = await Post.findOne({
            _id: req.params.id,
            author: req.user.id, // Ensure the user is the author of the post
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        post.state = "published";
        await post.save();
        return res.status(200).json({ message: "Post published successfully" });
    } catch (error) {
        next(error);
    }
};

export const unpublishPost = async (req, res, next) => {
    try {
        const post = await Post.findOne({
            _id: req.params.id,
            author: req.user.id, // Ensure the user is the author of the post
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        post.state = "draft";
        await post.save();
        return res.status(200).json({ message: "Post unpublished successfully" });
    } catch (error) {
        next(error);
    }   
};

export const likePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || post.state !== "published") {
            return res.status(400).json({ message: "Post not found" });
        }
        // Implementation for liking the post
        if (post.likes?.includes(req.user.id)) {
            return res.status(400).json({ message: "You have already liked this post" });
        }

        post.likes = [...new Set([...(post.likes || []), req.user.id])];
        post.like_count = post.likes.length; // Update like count
        await post.save();
        return res.status(200).json({ like_count: post.like_count });    
    } catch (error) {
        next(error);
    }
};

export  const unlikePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || post.state !== "published") {
            return res.status(400).json({ message: "Post not found" });
        }

        post.likes = (post.likes || []).filter(userId => userId.toString() !== req.user.id);
        post.like_count = post.likes.length; // Update like count
        await post.save();
        return res.status(200).json({ like_count: post.like_count });
    } catch (error) {
        next(error);
    }
};

export const feedPosts = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page)) || 1; // Default to page 1
        const limit = Math.max(1, Number(req.query.limit)) || 10; // Default to 10 posts per page
        const skip = (page - 1) * limit;

        const followRecords = await Follow.find({ follower: req.user.id }).select(
            'following'
        );

        const followingIds = followRecords.map(record => record.following.toString());
        followingIds.push(req.user.id); // Include the user's own posts in the feed

        const filter = {
            author: { $in: followingIds },
            state: "published", // Only include published posts
        };

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort({ createdAt: -1 }) // Sort by creation date (newest first)
                .skip(skip)
                .limit(limit)
                .populate('author', 'first_name last_name username profilePicture'), // Populate author details
            Post.countDocuments(filter), // Get total count for pagination
        ]);

        return res.status(200).json({
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            posts,
        });
    } catch (error) {
        next(error);
    }
};
