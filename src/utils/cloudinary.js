// cloudinary pr upload karne ky baad hamy server sy bhi delete karwani hai

import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        // console.log("file is uploaded on cloudinary", response.url);
        // console.log("response: ", response);
        return response
        
        // after upload on cloudry unlink/delete it
        fs.unlinkSync(localFilePath)
    } catch (error) {
        fs.unlinkSync(localFilePath)    //remove the locally saved temporary fils as the upload operation got failed

        console.log("Error uploading file to Cloudinary:", error);
        return null;
    }
}

export { uploadOnCloudinary }


// website code

// cloudinary.v2.uploader.upload("dog.mp4", {
//   resource_type: "video", 
//   public_id: "my_dog",
//   overwrite: true, 
//   notification_url: "https://mysite.example.com/notify_endpoint"})
// .then(result=>console.log(result));