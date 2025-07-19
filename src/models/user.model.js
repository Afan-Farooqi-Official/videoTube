import mongoose, {mongo, Schema} from "mongoose"   // we de-constructed mongoose for more info visit js de-construct file
// jwt is beared token like key
// jwt: Used to create and verify tokens for authentication (Bearer token sent in headers)
import jwt from "jsonwebtoken"

// bcrypt: Used to hash passwords securely and compare them during login
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true     // for making searchable in mongoDB
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,   //cloudinary url like aws 
            required: true,
        },
        coverImage: {
            type: String,   //cloudinary url like aws 
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            require: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        },
        tweets: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tweet"
            }
        ],
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timestamps: true
    }
)

// like app.listen, app.on(error)


// problem when anyone change anything rather then password then it change password -> cause password problem
// therefore we use use if condititon, ifModified is build-in in it

// Mongoose pre-save hook: runs before saving a user document
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next(); // Don't stop Mongoose — just skip hashing and continue saving
    }
    // This is the hook 👇
    this.password = await bcrypt.hash(this.password, 10)
    // Tells Mongoose: “I’m done with this hook. Continue saving the user.”
    next()
})

// we are designing custom middleware to compare as user gives password but we encrypt it, it automatically know which encrption i used b/c he encrypted it
// we read this is js in bubble up or bubble in
// Custom method to check if entered password matches hashed one in DB
userSchema.methods.isPasswordCorrect = async function (password) {
    
    // 'password' = plain password entered by user
    // 'this.password' = hashed password stored in the database
    return await bcrypt.compare(password, this.password)    // bcrypt compares both and returns true/false
}

/*
In the backend, a token is a secure string (like a password) that proves:
✅ “This user is logged in and allowed to access protected routes.”
Usually, it’s a JWT (JSON Web Token) created after login and verified on every request.
*/

// Method to generate access token with user info
/* 
    This adds a custom function to the user model, so every user document 
    can call generateAccessToken() to create a JWT (access token) with their own data. ✅
*/
userSchema.methods.generateAccessToken = function(){
    /*
        A JWT is a token that securely stores user data (like ID/email), 
        and you can decode it using jwt.io or jwt.decode(token) in Node.js to see what's inside. 
    */
    return jwt.sign(
        {
            // User info fetched from MongoDB document
            // This data is encoded into the token — it will be readable after decoding (but can't be changed unless you have the secret).

            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,    // Secret key to sign the access token
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY  // Access token expiry duration (e.g., 15m)
        }
    )
}

// Method to generate refresh token (only needs user ID)
/* 
    JWT (JSON Web Token) is a token format used to securely send and verify 
    user identity between client and server — especially after login.

    After login, you need to keep the user logged in — without sending their username & password again and again.
    ✅ So you send them a JWT, like a "digital ID card" 🪪
    They send that token in future requests to prove: "I’m still logged in."

    🧾 What does a JWT look like?

    It’s just a long string like:
    eyJhbGciOiJIUzI1NiIsInR5cCI6...

    But if you decode it, it's made of 3 parts:
    HEADER.PAYLOAD.SIGNATURE

    📦 Example (decoded):
    1. Header:
    { "alg": "HS256", "typ": "JWT" }

    2. Payload (your data):
    { "userId": "123", "role": "admin" }

    3. Signature:
    A secret-encrypted part so it can't be tampered with.
*/
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            // Only user ID stored in refresh token
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,   // Separate secret for refresh token
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // Refresh token expiry (e.g., 7d)
        }
    )
}


export const User = mongoose.model("User", userSchema)  // Exporting User model based on userSchema for DB operations