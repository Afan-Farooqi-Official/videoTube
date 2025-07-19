import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asycHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // Validate pagination parameters
  // Ensure page and limit are numbers and greater than 0,
  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  // Validate page number and size
  if (isNaN(pageNumber) || pageNumber < 1) {
    throw new ApiError(400, "Invalid page number");
  }
  if (isNaN(pageSize) || pageSize < 1) {
    throw new ApiError(400, "Invalid page size");
  }

  // Build query object
  // This will allow searching by title or description
  // If query is provided, search by title or description
  const queryObject = {};
  if (query) {
    queryObject.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // If userId is provided, filter by user
  if (userId && isValidObjectId(userId)) {
    queryObject.user = userId;
  }

  // Build sort object
  // If sortBy is provided, sort by the specified field
  // Default to sorting by createdAt in descending order if no sortBy is provided
  const sortObject = {};
  if (sortBy) {
    const sortField = sortBy === "createdAt" ? "createdAt" : "title";
    sortObject[sortField] = sortType === "desc" ? -1 : 1;
  } else {
    sortObject.createdAt = -1; // Default to descending order by createdAt
  }

  // Fetch videos with pagination, sorting, and filtering
  const videos = await Video.find(queryObject)
    .sort(sortObject)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .populate("user", "username profilePicture") // Populate user details
    .exec();
  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos found");
  }

  // Get total count of videos for pagination
  const totalCount = await Video.countDocuments(queryObject).exec();
  const totalPages = Math.ceil(totalCount / pageSize);
  const response = {
    videos,
    pagination: {
      totalCount,
      totalPages,
      currentPage: pageNumber,
      pageSize,
    },
  };

  res
    .status(200)
    .json(new ApiResponse("Videos retrieved successfully", response));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  const videoLocalPath = req.files?.videoFile?.[0]?.path;

  let thumbnailLocalPath;
  if (req.files?.thumbnail?.length > 0) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  // Validate title and description
  if (!title || title.trim() === "") {
    throw new ApiError(400, "Title is required");
  }

  if (!description || description.trim() === "") {
    throw new ApiError(400, "Description is required");
  }

  // Upload video to Cloudinary
  const uploadedVideo = await uploadOnCloudinary(videoLocalPath, "video");
  const uploadedThumbnail = await uploadOnCloudinary(
    thumbnailLocalPath,
    "image"
  );

  if (!uploadedVideo) {
    throw new ApiError(500, "Failed to upload video");
  }

  // Create new video document
  const newVideo = new Video({
    title,
    description,
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail?.url || "",
    user: req.user._id, // Assuming user ID is available in req.user
  });

  // check if video uploaded successfully
  if (!newVideo.videoFile) {
    throw new ApiError(500, "Video upload failed");
  }

  // Save video to database
  await newVideo.save();

  // Add video ID to user's videos array
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.videos.push(newVideo._id);
  await user.save();

  res
    .status(201)
    .json(new ApiResponse(200, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find video by ID and populate user details
  const video = await Video.findById(videoId).aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        videoUrl: 1,
        userDetails: {
          username: "$userDetails.username",
          profilePicture: "$userDetails.profilePicture",
        },
        createdAt: 1,
      },
    },
  ]);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  res.status(200).json(new ApiResponse("Video retrieved successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Validate input: checking if both title and description are provided for updating the video

  if (!title || title.trim() === "") {
    throw new ApiError(400, "Title is required");
  }

  if (!description || description.trim() === "") {
    throw new ApiError(400, "Description is required");
  }

  // Find video by ID
  const video = await Video.findByIdAndUpdate(
    videoId,
    { title, description },
    { new: true, runValidators: true }
  );
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // If thumbnail is provided, upload it
  if (req.file) {
    const thumbnailLocalPath = req.file?.thumbnail?.[0]?.path;

    // Validate thumbnail file
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is required");
    }

    // Upload thumbnail to Cloudinary
    const uploadedThumbnail = await uploadOnCloudinary(
      thumbnailLocalPath,
      "image"
    );

    if (!uploadedThumbnail) {
      throw new ApiError(500, "Failed to upload thumbnail");
    }

    video.thumbnail = uploadedThumbnail.url;
  }

  // Save updated video
  await video.save();

  res.status(200).json(new ApiResponse("Video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find video by ID and delete it
  const video = await Video.findByIdAndDelete(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Remove video ID from user's videos array
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.videos.pull(video._id);
  await user.save();

  res.status(200).json(new ApiResponse("Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find video by ID
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Toggle publish status
  video.isPublished = !video.isPublished;
  await video.save();

  res
    .status(200)
    .json(new ApiResponse("Video publish status toggled successfully", video));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
