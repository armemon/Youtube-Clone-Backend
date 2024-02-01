import { v2 as cloudinary} from "cloudinary";
import { log } from "console";
import fs from 'fs'

// unlink ==> symbolic link is removed without that affecting file
// if file is not symbolic it will be deleted

cloudinary.config({   
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_KEY, 
    api_secret:  process.env.CLOUDINARY_SECRET
  });

const uploadOnCloudinary = async (filePath) =>{
    try {
        if(!filePath) return null
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",     // file type
            folder: 'videotube'       // added in folder in cloudinary server
        })
        // file has been successfully uploaded
        console.log("File is uploaded on cloudinary");
        // console.log(response);
        // console.log(response.url);
        fs.unlinkSync(filePath)
        return response
    } catch (error) {
        console.log("CLoudinary Error",error);
        fs.unlinkSync(filePath)
        return error
    }
}


// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });

export {uploadOnCloudinary}