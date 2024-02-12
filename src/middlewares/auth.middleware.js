import jwt  from "jsonwebtoken";
import { APIError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";



export const verifyJWT = asyncHandler(async (req, res, next) =>{
 try {
       // req.cookies is accesible due to cookie parser
       // req.header("Authorization") is for mobile app.. cokkies are not in mobile
       const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", '')
   
       if (!accessToken){
           throw new APIError(401, "Unauthorized Request")
       }
       const decodedToken= jwt.verify(token, process.env.ACCESS_TOKEN_EXPIRY)
   
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
   
       if(!user) {
           throw new APIError(401, "Invalid Access Token")
       }
       req.user =user;
       next()
 } catch (error) {
    throw new APIError(401, error.message || "Imvalid access token ")
 }
})