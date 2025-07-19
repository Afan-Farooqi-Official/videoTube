// just for verify user, hain bhi ya nhi

import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asycHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // console.log(token);
        
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        // verify access due to jwt
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})

/* 
🧠 First: When you log in:
Facebook gives your browser a token (usually stored in cookies or localStorage).
For every request (like loading your profile), your browser automatically sends the token:

If in cookies: sent by browser automatically.

If in headers: frontend JS adds it manually using fetch or axios. 
*/

/* 🍪 VS 🔐 Cookies vs Access/Refresh Tokens — What's What?

Concept	What it is	Who uses it	Purpose

Cookie      	Small piece of data stored in browser   	Browser	Stores token automatically & sends it back
Access Token	Token to prove "user is logged in"      	Server	Used to access protected routes
Refresh Token	Token to get a new access token	Server     	Used when access token expires

🔄 Real-Life Analogy:

Think of it like going to a building with a pass.
🪪 Access Token = Entry Pass: lets you enter, but expires in 10 mins.
🔁 Refresh Token = Backup Pass: you show this to the security desk to get a new entry pass.
🍪 Cookies = Pocket: browser holds your token in a cookie and shows it to the server every time.

🧠 When do we use refresh token?

Access tokens expire quickly for security (5–15 mins).
So when it's expired, you don’t log in again — you use the refresh token to ask the server:

POST /refresh-token
Body: { refreshToken: "xyz" }

Server replies:

{ accessToken: "newOne" }
✅ Basic Setup (Example):
Login:

Server sends:

Access Token (short-lived)
Refresh Token (long-lived)
Both saved in cookies or frontend storage

Access Protected Route:

Send access token in Authorization header or cookie.

If Access Token is expired:

Frontend sends refresh token → gets a new access token.
No need to re-login.

🔒 Why this mess?
Security: Short tokens reduce risk if stolen.

Convenience: Refresh token means user stays logged in. 
*/

/* 
"What is this Authorization header?"
Let’s go ultra-simple and clear.

🔐 What is the Authorization header?
It’s just a key-value pair in an HTTP request(An HTTP request is how your 
browser or app asks a server to get, send, update, or delete data over the internet.) that sends a token to the backend.

💬 Looks like this:

Authorization: Bearer abc123xyz

It tells the backend:
“Hey, I'm a logged-in user. Here’s my token so you can trust me.”

🧠 What sends this header?

Postman when you set “Bearer Token”
Frontend code using fetch or axios
Not your server — your client (browser/app/Postman) sends it

🔧 In Postman:
Go to the Authorization tab

Select Type: Bearer Token

Paste your token like: abc123xyz
→ Postman sends this header:

Authorization: Bearer abc123xyz

🔧 In frontend (React, JS, etc.):

fetch("/api/profile", {
  method: "GET",
  headers: {
    Authorization: "Bearer abc123xyz"
  }
});

📦 In the backend (your line):

req.header("Authorization")

It grabs this:

"Bearer abc123xyz"

Then .replace("Bearer ", "") removes Bearer so only the token remains.

🧠 Think of it like:
🍔 Authorization is the bag

🪪 Bearer abc123xyz is the ID card inside

Server opens the bag and reads the ID to allow/deny access
*/