// express: Creates the server.
import express from "express"
// cors: Controls who can access your backend.
import cors from "cors"
// cookieParser: Lets your server read cookies from the browser.
import cookieParser from "cookie-parser"

// You create an instance of the Express app.
const app = express()

/*
    app.use() is used to add middleware to your app — functions that run before your route handlers, 
    for things like parsing, logging, or routing.

    Explanation:
    origin: process.env.CORS_ORIGIN
    → Only allow requests from the specified frontend URL (like http://localhost:3000) but in .env we gave * means allow all.

    credentials: true
    → Allow cookies, tokens, or sessions to be sent in cross-origin requests.

    🧠 Simple summary:
    This line allows a specific frontend to access your backend and also send cookies or tokens along with the request.
*/

// Middleware = helper functions that run before your routes.
app.use(cors({
    origin: process.env.CORS_ORIGIN,  // Allow requests from specific origin
    credentials: true                 // Allow cookies or tokens in requests
}))

app.use(express.json({limit: "16kb"}))                       // Allows server to read JSON data (with 16kb size limit)
app.use(express.urlencoded({extended: true, limit: "16kb"})) // Allows server to read HTML form data
app.use(express.static("public"))                            // Lets browser access files like images, CSS, JS from the public folder
// request ky pass cookies ka access hai, is line me cookiepareser (middleware) use karky access dia
app.use(cookieParser())                                      // Lets server read cookies from incoming requests

/* 
    ✅ we are setting up middleware for the Express app.
    These app.use() lines let your backend read JSON, form data, cookies,
    and serve static files from the public folder.

    express.urlencoded() is middleware that helps Express read form data sent
        using application/x-www-form-urlencoded (default format of HTML forms).
    express.static() makes files in a folder (like public) publicly accessible to the browser.
    cookieParser() is a middleware that lets your Express app read cookies sent by the browser.

    Middleware is a function that runs between the request coming in and the response going out.
    ✅ Common types of middleware:
        express.json() – reads JSON body
        cookieParser() – reads cookies
        cors() – controls who can access your server
        Custom auth middleware – checks if user is logged in
*/

//routes import
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import commentRouter from './routes/comment.routes.js';
import likeRouter from './routes/like.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import healtcheckRouter from './routes/healthcheck.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';

//routes declaration
// we used "get" in chai_aur_deploy when working with models and our work happen but we now importing from other files
// and there we just using in it, there for we use "use"
// app.use("/users", userRouter) api batana chai tu

// jab /users click hoga tu userRouter pr chala jao ga, jo aya hai user.routers sy
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/healthcheck", healtcheckRouter)
app.use("/api/v1/dashboard", dashboardRouter)

//https://localhost:8000/users/register or login matlab users click osme jo hai wo sab access krsake gy


export default app // You export the app so it can be used elsewhere (e.g. in your server.js or index.js to start the server).

/*
Summary (very simple):
    You're setting up the Express app and telling it how to:
    Accept requests from frontend (CORS)
    Read JSON and form data
    Serve static files
    Read cookies
    Then you export it to use in the main server file.
*/