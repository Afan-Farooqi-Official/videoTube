import { Router } from "express"
import { 
    changeCurrentPassword, 
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory, 
    loginUser,
    logoutUser,
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage } from "../controllers/user.controller.js"
    
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { refreshAccessToken } from "../controllers/user.controller.js"

const router = Router()

// agar /register click hoga tu chalo ga or osky baad mujy bhej do registerUser pr jo aya
//  haai user.controller import karne sy
router.route("/register").post(
    // isko register sy phely(kioky ye middleware hai), phely avatar, coverImage add hogi phir user ko register karna
    upload.fields([
        {
            // fronttend ko bhi iska pata hona chahe kia name hai
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-pasword").post(verifyJWT, changeCurrentPassword)

// kuch set nhi kr rahe tu sirf get use kr lety hain matlab user kuch nhi bhej raha 
router.route("/current-user").get(verifyJWT, getCurrentUser)

// patch kioky agar post rakha tu sari fields update hojaye gi
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// yaha do middleware lagaya hai
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-Image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

// yaha hamny params me sy dia hai, already waha username bol dia hai
router.route("/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router