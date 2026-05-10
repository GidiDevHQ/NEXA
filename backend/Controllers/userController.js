import User from '../Models/User.js';
import Follow from '../Models/Follow.js';
import Post from '../Models/Post.js';

const buildFollowData = async (userId) => {
    const [followers, following] = await Promise.all([
        Follow.find({ following: userId }).populate(
            'follower',
            'first_name last_name username email avatarUrl'
        ),
        Follow.find({ follower: userId }).populate(
            'following',
            'first_name last_name username email avatarUrl'
        ),
    ]);

    return {
        followers: followers.map((record) => record.follower),
        following: following.map((record) => record.following),
        followersCount: followers.length,
        followingCount: following.length,
    };
};

export const getMyProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const followData = await buildFollowData(user._id);
        return res.status(200).json({ user: { ...user.toObject(), ...followData } });
    } catch (error) {
        next(error);
    }
};

export const getMyPosts = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const filter = { author: req.user.id };
        if (req.query.state && ['draft', 'published', 'archived'].includes(req.query.state)) {
            filter.state = req.query.state;
        }

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Post.countDocuments(filter),
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

export const followUser = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId;
        if (targetUserId === req.user.id) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(400).json({ message: "User to follow not found" });
        }

        const existingFollow = await Follow.findOne({
            follower: req.user.id,
            following: targetUserId,
        });
        if (existingFollow) {
            return res.status(409).json({ message: "Already following this user" });
        }

        await Follow.create({
            follower: req.user.id,
            following: targetUserId,
        });

        return res.status(201).json({ message: "Now following this user" });
    } catch (error) {
        next(error);
    }
};

export const unfollowUser = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId;

        const deleted = await Follow.findOneAndDelete({
            follower: req.user.id,
            following: targetUserId,
        });

        if (!deleted) {
            return res.status(404).json({ message: "You are not following this user" });
        }

        return res.status(200).json({ message: "Unfollowed user successfully" });
    } catch (error) {
        next(error);
    }
};

export const getFollowing = async (req, res, next) => {
    try {
        const following = await Follow.find({ follower: req.user.id }).populate(
            'following',
            'first_name last_name username email avatarUrl'
        );
        return res.status(200).json(
            following.map((record) => record.following)
        );
    } catch (error) {
        next(error);
    }
};

export const getFollowers = async (req, res, next) => {
    try {
        const followers = await Follow.find({ following: req.user.id }).populate(
            'follower',
            'first_name last_name username email avatarUrl'
        );
        return res.status(200).json(
            followers.map((record) => record.follower)
        );
    } catch (error) {
        next(error);
    }
};

export const updateMyProfile = async (req, res, next) => {
    try {
        const updates = { ...req.body };
        delete updates.password;

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true,
            select: '-password',
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

export const deleteMyProfile = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Follow.deleteMany({ $or: [{ follower: req.user.id }, { following: req.user.id }] });
        await Post.deleteMany({ author: req.user.id });

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const followData = await buildFollowData(user._id);
        return res.status(200).json({ user: { ...user.toObject(), ...followData } });
    } catch (error) {
        next(error);
    }
};

export const getUserPosts = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const filter = { author: req.params.userId, state: 'published' };

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Post.countDocuments(filter),
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
