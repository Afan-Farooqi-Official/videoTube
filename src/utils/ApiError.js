// Create a custom error class that extends the built-in Error class

class ApiError extends Error {
    // Constructor takes statusCode, message, extra errors, and optional stack trace
    constructor(
        statusCode, 
        message= "Something went wrong", 
        errors = [], 
        stack = ""
    ){
        // Call parent (Error) constructor with the message
        super(message)

        // Set HTTP status code like 400, 401, 500, etc.
        this.statusCode = statusCode

        // Placeholder for any data (can be filled later if needed)
        this.data = null;

        // Custom error message
        this.message = message

        // Flag to indicate the request failed
        this.success = false

        // Store any extra error info (like validation errors)
        this.errors = errors

        // pata chal jaye ga kaha kaha error hai  // 📍 Stack trace: shows where the error came from
        if (stack) {
             // If stack is provided manually, use it
            this.stack = stack
        }else{
            // Else capture the stack trace automatically
            Error.captureStackTrace(this, this.constructor) // (You had a typo: "constructor")
        }
    }
}

// Export the class so you can use it in other files
export { ApiError }