import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


// when asyc function completes it return a promise

const connectDB = async () => {
    try {
        const connectionInstances = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n MonogoDB connected !! DB HOST: ${connectionInstances.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connection error ", error);
        process.exit(1)
        //  process.exit(0) → Success (normal exit)
        //  process.exit(1) → Failure (something went wrong)
    }
}

export default connectDB