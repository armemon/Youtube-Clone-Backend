import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (user) => {
  try {
    // console.log("user", user);
    // const user = await User.findById(userID)

    // Everytime access token and refresh token is different
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    console.log({ accessToken, refreshToken });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(500, error);
  }
};

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
    console.log("coverImage", coverImage); // returned null if image is not there

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
  const { emailOrUsername, password } = req.body;

  // console.log(req.body);
  if (!emailOrUsername) {
    throw new APIError(400, "email or username is required");
  }
  const user = await User.findOne({
    $or: [{ username: emailOrUsername }, { email: emailOrUsername }],
  });

  if (!user) {
    throw new APIError(404, "User does not exist");
  }

  // use user (small letters) which is found from MongoDB to acces method inside it
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new APIError(401, "Invalid User credential");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  // const loggedInUser = user.select("-password");
  const loggedInUser = await User.findById(user._id).select([
    "-password",
    "-refreshToken",
  ]);

  // adding cookies

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new APIResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        //set is operator
        refreshToken: 1, //undefined doesnot change refresh token therefore 1 to reset refresh token
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  console.log(req.cookies);

  if (!incomingRefreshToken) {
    // Application should not give 200 response if it is not working well
    throw new APIError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new APIError(401, "Invalid Refresh Token");
    }

    // if old refresh token is being used
    if (incomingRefreshToken !== user.refreshToken) {
      throw new APIError(401, "Refresh token is experied or changed");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new APIResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid Refresh Token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  if(!newPassword || !oldPassword){
    throw new APIError(400, "Old and New both Password are required")
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user?.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new APIError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new APIResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new APIResponse(200, req.user, "Current User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new APIError(400, "Atleast one field is required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new APIResponse(200, user, "Account Detail Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // req.file due to
  const avatarlocalPath = req.file?.path;

  if (!avatarlocalPath) {
    throw new APIError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath);

  if (!avatar?.url) {
    throw new APIError(400, "Error while uploading Avatar on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new APIResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // req.file due to
  const coverlocalPath = req.file?.path;

  if (!coverlocalPath) {
    throw new APIError(400, "Cover Image file is missing");
  }

  const cover = await uploadOnCloudinary(coverlocalPath);

  if (!cover?.url) {
    throw new APIError(400, "Error while uploading Cover Image on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        cover: cover.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new APIResponse(200, user, "Cover Image updated successfully"));
});

const getChannelProfile = asyncHandler(async (req, res) => {
  const {channelUsername} = req.params;

  if (!channelUsername) {
    throw new APIError(400, "Channel Username is missing");
  }

  const channel = await User.aggregate([
    { $match: { username: channelUsername.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers", //Subscription model will be saved as subscriptions collection(table) in M_DB
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo", //Subscription model will be saved as subscriptions collection(table) in M_DB
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToChannelCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.users?._id, "$subscribers.subscriber"] }, //subscriber from subsribtion Model
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribedToChannelCount: 1,
        subscribersCount: 1,
        isSubscribed:1,
      },
    },
  ]);

  console.log(channel); // channel is an array of match documents left after pipeline stages
  // since we have only one document of a username.. one element will be in channel array

  if (!channel?.length) {
    console.log(channelUsername);
    throw new APIError(404, "No channel found");
  }

  res
    .status(200)
    .json(
      new APIResponse(200, channel[0], "Channel Profile recieved successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id), // new is necessary
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                // $arrayElemAt: [ "$watchHistory", 0 ]   //or
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        user[0].watchHistory,        //watch history is in array datatype
        "Watch History fetched SUccessfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getChannelProfile,
  getWatchHistory,
};
