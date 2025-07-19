import { asyncHandler } from "../utils/asycHandler.js";
import { ApiError } from ".././utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";
import { subscribe } from "diagnostics_channel";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            
            throw new ApiError(404, "user not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // object me daal dia
        user.refreshToken = refreshToken
        // validate means -> ye password mangta hai save sy phely is lye ye false kia
        // access token save rahta hai long term islye save kia database me
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        console.log("token error", error);
        
        throw new ApiError(500, "Something went wrong, while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // steps for register user
    // 1 get user details from frontend
    // 2 validation - not empty
    // 3 check if user already exists: by userName, email
    // 4 check for image, check for avatar
    // 5 upload them to cloudinary, avatar
    // 6 create user - create entry in db
    // 7 remove password and refresh token field from response
    // 8 check for user creation
    // 9 return res

    // 1 user detail from frontend, form sy ya json sy aye tu body me mil jaye ga, url ky liye alag method hai
    const {fullName, email, userName, password} = req.body
    // console.log("email: ", email);
    // console.log("req.body: ", req.body);
    
    

    // 2 check validation
    // if else ki chain sy bhi sari required fields check kar sakte hai but bara code ho jaye ga islye
    if (
        [fullName, email, userName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // 3 check if user exist
    // findOne return first one found
    const existedUser = await User.findOne({
        $or: [{userName}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or userName already exist")
    }

    // 4 check image, files ka access hamy multer sy mila hai
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log("req.files: ", req.files);
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // cover image na dy tu, error aye osko check karne ky liye
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.avatar[0]?.path
    }

    // now check as avatar is required
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // 5 upload on cloudinary
    // that's why we use asyc in start b/c cloudinary takes time and we not to move before this

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // check if avatar not, b/c required warna database phate ga
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // 6 entry in database, as only user communicate to databse created using mongoose
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    // 7 check if user created succesfully, agar howa tu id hogi kioky mongo db detab hai 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8 is user created
    if (!createdUser) {
        throw new ApiError(500, "something went worng, while registering user")
    }

    // 9 response back , data send kar rahe hai sara created user ka 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

    
})

const loginUser = asyncHandler(async (req, res) => {
    // steps
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    // return res
    
    const {username, email, password} = req.body
    console.log("username: ", username);
    
    if (!username && !email) {      // or (!(username || email))
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // This user was created before we added the refreshToken field, so it's empty for now.
    // If performance becomes an issue, use object destructuring instead of .select()
    const loggedInUser = await User.findById(user._id).select( "-password -refreshToken")

    // send cookies
    const options = {
        // not modified from server but from server/backend only
        // security steps hai bhai
        httpOnly: true,
        secure: true
    }

    // return response
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        // not modified from server but from server/backend only
        // security steps hai bhai
        httpOnly: true,
        secure: true
    }


    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged Out")
    )
})

// contoller(end-point) for user, where user refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // body -> ho sakta hai mobile app ho
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    console.log(req.body.refreshToken);
    

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError("Invalid refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findById(
        req.user?._id,
        {
            //mongoDb operator
            $set: {
                fullName: fullName,
                email: email
                
                //  or
                // fullName,
                // email 
                
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .jso(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    //files b/c of multer
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Image updated successully"
    ))
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    //files b/c of multer
    const coverImageLocalPath = req.file?.coverImage?.[0]?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image updated successully"
        )
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(404, "username is missing")
    }

    // no need to use find, in aggregation we have match work same as find

    const channel = await User.aggregate([
        {
            // ham username ki help sy chai aur code ky subscribers nikaly gay
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            /*In MongoDB's Aggregation Pipeline, $lookup is a stage used to join documents
             from two collections — similar to a JOIN in SQL.*/
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscibedTo"
            }
        },
        {
            $addFields: {
                // hamny user wale model ko do or fields dy di
                subscriberCount: {
                    // for counting all objects
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    // using condition
                    $cond: {
                        // matlab subscribers jo hamny field bana kr connect ki model sy osmy ja kar subscriber dekh lo
                        // in arrays me or objects dono me dekh lety haim
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        // In MongoDB Aggregation, $project is a stage used to include, exclude, or transform fields in the output documents. 
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }

    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiError(200, channnel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                // _id: req.user._id
                /* 
                    here is issue as mongodb gives you id like object('abc'), use object and paranthesis
                    while when we using mongoose, it convert this automatically to string.
                    while aggregation pipline directly connected to mongodb, so we have to 
                    write according to mongodb. that's all
                */
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // in videos go to history part
        {
            $lookup: {
                from: "videos",
                // we are creating, not define before
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // sub pipeline for getting owner
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // sub-pipeline pora user agaya islye one more pipeline, but hamy kuch fields chahe
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                // for user easiness, hm array nhi dy rahy hm first object dy rahe, agar kuch chahe tu dot krky nikal ly ga
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiError(200, user[0].watchHistory, "Watch history fetched successfully"))
})


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}