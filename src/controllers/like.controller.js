import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asycHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Check if the user has already liked the video
    const existingLike = await Like.findOne({
        user: userId,
        video: videoId
    })

    // If the user has already liked the video, remove the like
    if (existingLike) {
        await Like.deleteOne({
            user: userId,
            video: videoId
        })
        return res.status(200).json(new ApiResponse("Like removed successfully"))
    }

    // If the user has not liked the video, add a new like
    const newLike = new Like({
        user: userId,
        video: videoId
    })

    await newLike.save()

    res.status(201).json(new ApiResponse("Video liked successfully", newLike))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Check if the user has already liked the comment
    const existingLike = await Like.findOne({
        user: userId,
        comment: commentId
    })

    // If the user has already liked the comment, remove the like
    if (existingLike) {
        await Like.deleteOne({
            user: userId,
            comment: commentId
        })
        return res.status(200).json(new ApiResponse("Like removed successfully"))
    }

    // If the user has not liked the comment, add a new like
    const newLike = new Like({
        user: userId,
        comment: commentId
    })
    await newLike.save()

    res.status(201).json(new ApiResponse("Comment liked successfully", newLike))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Check if the user has already liked the tweet
    const existingLike = await Like.findOne({
        user: userId,
        tweet: tweetId
    })

    // If the user has already liked the tweet, remove the like
    if (existingLike) {
        await Like.deleteOne({
            user: userId,
            tweet: tweetId
        })
        return res.status(200).json(new ApiResponse("Like removed successfully"))
    }

    // If the user has not liked the tweet, add a new like
    const newLike = new Like({
        user: userId,
        tweet: tweetId
    })
    await newLike.save()

    res.status(201).json(new ApiResponse("Tweet liked successfully", newLike))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Find all likes by the user
    const likedVideos = await Like.find({ user: userId, video: { $exists: true } })
        .populate('video', 'title description thumbnailUrl') // Populate video details
        .exec()

    // If no liked videos found, return 404
    if (!likedVideos || likedVideos.length === 0) {
        return res.status(404).json(new ApiResponse("No liked videos found"))
    }

    res.status(200).json(new ApiResponse("Liked videos retrieved successfully", likedVideos))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}