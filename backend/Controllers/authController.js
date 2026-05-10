import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../Models/User.js';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    )
        
        // Use environment variable for token expiration
}; // Generate JWT token for authentication

// Register a new user
export const signUp = async (req, res, next) => {
    try {
        const { firstName, lastName, username, email, password, confirmPassword, profilePicture, bio } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        };

        if (
            !firstName ||
            !lastName ||
            !username ||
            !email ||
            !password ||
            !confirmPassword ||
            !validator.isEmail(email)
        ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email or username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            first_name: firstName,
            last_name: lastName,
            username,
            email,
            password: hashedPassword,
            profilePicture: profilePicture || '',
            bio: bio || '',
        });

        await newUser.save();

        const token = generateToken(newUser);

        const userData = newUser.toObject();
        delete userData.password; // Remove password from the response

        res.status(201).json({ token, user: userData });
    } catch (error) {
        next(error);
    }
};

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);
        const userData = user.toObject();
        delete userData.password;

        return res.status(200).json({ token, user: userData });
    } catch (error) {
        next(error);
    }
}