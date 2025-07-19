// Create a wrapper to handle errors in async route functions using Promises

const asyncHandler = (requestHandler) => {

     // Return a new function that Express will call with (req, res, next)
    return (req, res, next) => {
         // Run the original async route handler and wrap it in a Promise
        Promise.resolve(requestHandler(req, res, next))
        // If any error happens inside the async function, catch it
        .catch((err) => next(err))  // Pass the error to Express's error handling middleware (means to next middleware)
    }
}

// Export the asyncHandler function to use in other files
export {asyncHandler}

// by using try catch
// asychandler is higher order function, wo function jo functions ko as a parameter bhi accept kar sakte hai ya phir return bhi krsakte hai
// treat function as variable

// const asycHandler = () => {}
// const asycHandler = (func) => {() => {}}
// const asychandler = (func) => async {() => {}}

// wrapper function we use anywhere
// const asycHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

/* This asyncHandler catches errors from async functions (like database calls)
 and sends a proper JSON response instead of crashing your app. 
 
✅ Step-by-step in bullet points:

🔹 asyncHandler is a higher-order function (a function that returns another function).
🔹 It takes an async function fn as an argument (usually a controller or route handler).
🔹 It returns a new async function that takes (req, res, next) like a normal Express route.

🔹 Inside the new function:
try: It tries to await fn(req, res, next), meaning it runs your actual route/controller logic.

catch: If any error happens in that function:
It sends a response with res.status(...)
The status is error.code if defined, or 500 by default.
Sends a JSON response with success: false and the error message.
🔹 This helps you avoid writing try-catch in every route.

Step-by-step:

res.status(error.code || 500)
Sets the HTTP status code for the response.
If error.code exists → use it.
If not → use 500 (Internal Server Error).

.json({...})
Sends a JSON response back to the client with:
success: false → tells frontend the request failed.
message: error.message → gives details about what went wrong.

This line sends a clear error response to the client with the right status code and message.
*/