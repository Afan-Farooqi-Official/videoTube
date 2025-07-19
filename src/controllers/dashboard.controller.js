import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asycHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelId = req.params.channelId
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Get total videos uploaded by the channel
    const totalVideos = await Video.countDocuments({ channel: channelId })
    if (totalVideos === 0) {
        return res.status(404).json(new ApiResponse("No videos found for this channel"))
    }

    // Get total subscribers of the channel
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId })
    if (totalSubscribers === 0) {
        return res.status(404).json(new ApiResponse("No subscribers found for this channel"))
    }

    // Get total likes on the channel's videos
    const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ channel: channelId }).distinct('_id') } })
    if (totalLikes === 0) {
        return res.status(404).json(new ApiResponse("No likes found for this channel's videos"))
    }

    // Get total views on the channel's videos
    const totalViews = await Video.aggregate([
        { $match: { channel: channelId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ])

    if (totalViews.length === 0) {
        return res.status(404).json(new ApiResponse("No views found for this channel's videos"))
    }

    res.status(200).json(new ApiResponse("Channel stats retrieved successfully", {
        totalVideos,
        totalSubscribers,
        totalLikes,
        totalViews: totalViews[0].totalViews
    }))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const channelId = req.params.channelId
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Find all videos uploaded by the channel
    const videos = await Video.find({ channel: channelId })
        .populate('channel', 'name description') // Populate channel details
        .exec()
        
    // If no videos found, return 404
    if (!videos || videos.length === 0) {
        return res.status(404).json(new ApiResponse("No videos found for this channel"))
    }

    res.status(200).json(new ApiResponse("Channel videos retrieved successfully", videos))
})

export {
    getChannelStats, 
    getChannelVideos
    }