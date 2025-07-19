// Define a class to create consistent API responses

class ApiResponse {
    // Constructor to initialize the response
    constructor(statusCode, data, message = "Succcess"){

        // Set the HTTP status code (e.g. 200, 201, etc.)
        this.statusCode = statusCode,

        // Set the actual data to be returned (like user info, product, etc.)
        this.data = data,

        // Set the message (default is "Success" if not provided)
        this.message = message,

        // If statusCode is less than 400 → it's a success
        // true for 2xx or 3xx responses, false for 4xx and 5xx these for errors
        this.success = statusCode < 400
    }
}

export { ApiResponse }

/*
We put ApiResponse in a separate utils file so we can reuse it everywhere,
 keep code clean, and make our API consistent and maintainable.
*/
