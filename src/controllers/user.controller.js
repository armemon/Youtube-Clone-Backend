import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import fs from "fs";

const registerUser = asyncHandler(async (req, res) => {
  //  get user details from frontend
  // validation not empty
  // check if user already exist: username, email
  //  check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //   const avatarLocalPath = req.files?.avatar[0]?.path;
  let avatarLocalPath;
  if (Array.isArray(req.files?.avatar) && req.files?.avatar[0]) {
    avatarLocalPath = req.files?.avatar[0]?.path;
  } else {
    console.log("req.files", req.files);
    throw new APIError(400, "Avatar File is required");
  }
  //   const coverLocalPath = req.files?.coverImage[0]?.path;

  let coverLocalPath;
  if (Array.isArray(req.files?.coverImage) && req.files?.coverImage[0]) {
    coverLocalPath = req.files?.coverImage[0]?.path;
  }

  //   if (!avatarLocalPath) {
  //     throw new APIError(400, "Avatar file is required");
  //   }

//   console.log("req.body", req.body);
//   console.log("res", res);


  try {
    if (
      [fullName, email, username, password].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      throw new APIError(400, "All fields are required");
    }

    //  Email Validation can also be checked and can be made a folder of validation

    // CHeck if username or email is used before
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      console.log("existedUser.username", existedUser.username);
      throw new APIError(409, "USer with email or username already existed");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if (!avatar.url) {
      throw new APIError(400, "Avatar file not uploaded correctly");
    }

    console.log("avatar", avatar);
    console.log("coverImage", coverImage);   // returned null if image is not there

    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url,
      email,
      password,
      username: username.toLowerCase(),
    });
    //   .then((user)=>{

    //   })

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    console.log(
      "User Select Array",
      await User.findById(user._id).select(["-password", "-refreshToken"])
    );

    if (!createdUser) {
      throw new APIError(500, "Something went wrong while regestring User");
    }

    return res
      .status(201)
      .json(new APIResponse(201, createdUser, "User registered Successfully"));
  } catch (error) {
    coverLocalPath && fs.unlinkSync(coverLocalPath);
    avatarLocalPath && fs.unlinkSync(avatarLocalPath);
    throw error;
  }
});


const loginUser = asyncHandler(async (req, res) => {
    const { emailUsername, password} =req.body

    if(!emailUsername){
        throw new APIError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{username: emailUsername}, {email: emailUsername}]
    })

    if(!user){
        throw new APIError(404, "username does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new APIError(401, "Invalid User credential")
    }

    
})


export { registerUser };
