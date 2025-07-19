import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asycHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {title, description} = req.body

    //TODO: create playlist

    // Validate the request body
    if (!title || !description) {
        throw new ApiError(400, "title and description are required")
    }

    // Get the user ID from the request
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Create a new playlist
    const newPlaylist = new Playlist({
        title,
        description,
        owner: userId
    })

    // Save the playlist to the database
    await newPlaylist.save()

    res.status(201).json(
        new ApiResponse(200, newPlaylist, "Playlist created successfully")
    )
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    // console.log("Fetching playlists for user:", userId)

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // we find playlist by pipline
    const playlists = await User.aggregate([
        {
            $match: {_id: new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup: {
                from: 'playlists',
                localField: '_id',
                foreignField: 'owner',
                as: 'playlists'
            }
        },
        {
            $unwind: '$playlists'
        },
        {
            // This stage replaces the root document with the playlists array
            $replaceRoot: {newRoot: '$playlists'}
        }
    ])

    // If no playlists found, return 404
    if (!playlists || playlists.length === 0) {
        return res.status(404).json(new ApiResponse("No playlists found for this user"))
    }

    res.status(200).json(
        new ApiResponse(200, playlists, "Playlists retrieved successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // console.log(playlistId)
    
    // const plainPlaylist = await Playlist.findById(playlistId);
    // console.log(plainPlaylist);

    // Find the playlist by ID and use pipline
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)

            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails'
            }
        },
        {
            $unwind: '$ownerDetails'
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'videos',
                foreignField: '_id',
                as: 'videoDetails'
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                videos: '$videoDetails',
                owner: {
                    _id: '$ownerDetails._id',
                    name: '$ownerDetails.name',
                    email: '$ownerDetails.email'
                },
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]).exec()

    // If playlist not found, return 404
    if (!playlist) {
        return res.status(404).json(new ApiResponse("Playlist not found"))
    }

    res.status(200).json(
        new ApiResponse(200, playlist,"Playlist retrieved successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    // Find the playlist by ID
    const playlist = await Playlist.findById(playlistId)
        .exec()

    // If playlist not found, return 404
    if (!playlist) {
        return res.status(404).json(new ApiResponse("Playlist not found"))
    }

    // Check if video already exists in the playlist
    if (playlist.videos.includes(videoId)) {
        return res.status(400).json(new ApiResponse("Video already exists in the playlist"))
    }

    // Add video to the playlist
    playlist.videos.push(videoId)
    await playlist.save()

    res.status(200).json(new ApiResponse("Video added to playlist successfully", playlist))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    // Find the playlist by ID
    const playlist = await Playlist.findById(playlistId)
        .exec()

    // If playlist not found, return 404
    if (!playlist) {
        return res.status(404).json(new ApiResponse("Playlist not found"))
    }

    // Check if video exists in the playlist
    if (!playlist.videos.includes(videoId)) {
        return res.status(400).json(new ApiResponse("Video not found in the playlist"))
    }

    // Remove video from the playlist
    playlist.videos = playlist.videos.filter(video => video.toString() !== videoId)
    await playlist.save()

    res.status(200).json(new ApiResponse("Video removed from playlist successfully", playlist))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Find the playlist by ID
    const playlist = await Playlist.findById(playlistId)
        .exec()

    // If playlist not found, return 404
    if (!playlist) {
        return res.status(404).json(new ApiResponse("Playlist not found"))
    }

    // Delete the playlist
    await Playlist.deleteOne({_id: playlistId})

    res.status(200).json(new ApiResponse("Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Find the playlist by ID
    const playlist = await Playlist.findById(playlistId)
        .exec()

    // If playlist not found, return 404
    if (!playlist) {
        return res.status(404).json(new ApiResponse("Playlist not found"))
    }

    // Update playlist details
    if (name) {
        playlist.name = name
    }
    if (description) {
        playlist.description = description
    }

    await playlist.save()

    res.status(200).json(new ApiResponse("Playlist updated successfully", playlist))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}