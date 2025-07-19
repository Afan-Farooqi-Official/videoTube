import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asycHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    // Validate video ID
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find comments for the video with pagination
    const comments = await Comment.find({video: videoId})
        .populate('user', 'username') // Populate user details
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({createdAt: -1}); // Sort by creation date, newest first
    
    // Check if comments exist
    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No comments found for this video");
    }

    res.status(200).json(new ApiResponse("Comments retrieved successfully", comments));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    // Extract video ID and content from request
    const {videoId} = req.params
    const {content} = req.body;
    const userId = req.user._id;

    // Validate input
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    // Check if video ID is valid
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Create a new comment and save it
    const comment = new Comment({
        content,
        video: videoId,
        user: userId
    });
    await comment.save();

    // Add comment ID to video's comments array
    const video = await video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    video.comments.push(comment._id);
    await video.save();

    res.status(201).json(new ApiResponse("Comment added successfully", comment));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;
    const userId = req.user._id;

    // Validate input
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    // Check if comment ID is valid
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // Find the comment and update it
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user is the owner of the comment
    if (comment.user.toString() !== userId) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    // Update the comment content
    comment.content = content;
    await comment.save();

    res.status(200).json(new ApiResponse("Comment updated successfully", comment));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    // Extract comment ID from request
    const {commentId} = req.params;
    const userId = req.user._id;

    // Validate comment ID
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // Find the comment and delete it
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user is the owner of the comment
    if (comment.user.toString() !== userId) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    // Delete the comment
    await comment.remove();

    // Remove comment ID from video's comments array
    const video = await video.findById(comment.video);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    video.comments.pull(comment._id);
    await video.save();

    res.status(200).json(new ApiResponse("Comment deleted successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }