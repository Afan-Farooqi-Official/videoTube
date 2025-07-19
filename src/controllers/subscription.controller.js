import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asycHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Check if the user is already subscribed to the channel
    const existingSubscription = await Subscription.findOne({
        user: userId,
        channel: channelId
    })

    // If the user is already subscribed, unsubscribe them
    if (existingSubscription) {
        await Subscription.deleteOne({
            user: userId,
            channel: channelId
        })
        return res.status(200).json(new ApiResponse("Unsubscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Find all subscriptions for the channel
    const subscribers = await Subscription.find({ channel: channelId })
        .populate('user', 'name email') // Populate user details
        .exec()

    // If no subscribers found, return 404
    if (!subscribers || subscribers.length === 0) {
        return res.status(404).json(new ApiResponse("No subscribers found for this channel"))
    }
    return res.status(200).json(new ApiResponse("Subscribers retrieved successfully", subscribers))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Find all subscriptions for the user
    const subscriptions = await Subscription.find({ user: subscriberId })
        .populate('channel', 'name description') // Populate channel details
        .exec()
    
    // If no subscriptions found, return 404
    if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json(new ApiResponse("No subscribed channels found for this user"))
    }

    return res.status(200).json(new ApiResponse("Subscribed channels retrieved successfully", subscriptions))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}