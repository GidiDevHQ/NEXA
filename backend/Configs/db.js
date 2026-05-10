import mongoose from "mongoose";

const connectDB = async (mongoUri) => {
    try {
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error; // Rethrow the error to be handled by the caller
    }
    
};

export default connectDB;