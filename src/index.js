// require('dotenv').config({path: './env'})

// Import dotenv to load environment variables from .env file
import dotenv from "dotenv"

// Import function to connect to MongoDB
import connectDB from "./db/index.js"

import app from './app.js';


// Load variables from .env file located at "./env"
dotenv.config({
    path: './.env'
})

// Connect to MongoDB database
connectDB()
.then( () => {

    /*
        ✅ If DB connection is successful:
        We now prepare to start the server.
    */

    /* 
        Even if DB is connected, we still need to handle server errors like:
            Port already in use
            Permission denied
            Unexpected server crash
        So we add app.on("error", ...) after DB connects to catch these problems when the server starts. 
    */

    // Listen for any server-related errors (like port already in use)
    app.on("error", (error) => {
        console.log("ERROR: ", error);
        throw error                         // Crash the app if a serious server error occurs
    })
    // to start our server by using listen // Start the server on given PORT from .env or default to 8000
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    // ❌ If DB connection fails, log the error and don’t start the server
    console.log("MONGO db connection failed !!! ", err);
})


/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express"

//iife
( async () => {
    try {
        
        //   mongoose.connect(...) is a function that connects your Node.js app to your MongoDB database using Mongoose (an ODM for MongoDB).
        //  await pauses your code until the connection is fully established. It ensures the database is connected before running the next line.
        //   ${process.env.MONGO_URI} reads the MongoDB base URL (like mongodb+srv://username:password@cluster0.mongodb.net) from your .env file.
        //  /${DB_NAME} adds the database name (e.g. myAppDB) at the end of the URL.
        
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        // listener(error) of express -> if error means our express not talking to them
        app.on("error ", (error) => {
            console.log("ERROR ", error);

            // We `throw` in `catch` to pass the error forward or give a custom error message for better handling.
            // ✅ Simple one-liner meaning:
            // We throw after logging to let other parts of the app handle the error properly.
            // If you only console.log, the program thinks the error is handled and won’t stop or notify other handlers.

            
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
            
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
} )()
*/