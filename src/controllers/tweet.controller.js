import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asycHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    // Extract content and user ID from request
    const { content } = req.body;
    // console.log("Creating tweet with content:", content, "for owner:", owner);

    const userId = req.user._id; // Get user ID from authenticated request

    
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Validate input
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    // Create a new tweet and save it
    const tweet = new Tweet({
        content,
        owner: userId
    });
    await tweet.save();

    // Add tweet ID to user's tweets array
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    user.tweets.push(tweet._id);
    await user.save();

    // Return success response
    return res.status(201).json(
        new ApiResponse(200, tweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    
    // Extract user ID from request
    const userId = req.user._id;

    // Validate user ID
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // console.log("Fetching tweets for user:", userId);

    // Find user and use pipline
    const tweets = await User.aggregate([
        {
            $match: { 
                _id: new mongoose.Types.ObjectId(userId)
            } // Match user by ID
        },
        {
            $lookup: {
                from: "tweets", // Collection name for tweets
                localField: "tweets", // Field in user document
                foreignField: "_id", // Field in tweet document
                as: "tweets" // Output array field
            }
        },
        {
            $unwind: "$tweets" // Unwind tweets array to get individual tweet documents
        },
        {
            $project: {
                _id: 0, // Exclude user ID from output
                tweets: 1 // Include tweets in output
            }
        }
    ]);

    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found for this user");
    }

    res.status(200).json(
        new ApiResponse(200, tweets, "User tweets retrieved successfully")
    );
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    // Extract tweet ID and content from request
    const { tweetId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    // Check if content is provided
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    // Find the tweet by ID and update it
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content },
        { new: true, runValidators: true }
    );

    // Check if tweet exists
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    );
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    // Extract tweet ID from request
    const { tweetId } = req.params;

    // Validate tweet ID
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    // Find the tweet by ID and delete it
    const tweet = await Tweet.findByIdAndDelete(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Remove tweet ID from user's tweets array
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Filter out the deleted tweet ID from user's tweets array
    // explain filter() - it creates a new array with all elements that pass 
    // the test implemented by the provided function
    user.tweets = user.tweets.filter(id => id.toString() !== tweetId);
    await user.save();

    res.status(200).json(
        new ApiResponse(200, tweet, "Tweet deleted successfully", )
    );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}