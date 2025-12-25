import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import { generateJWTToken } from '../utils/jwtToken.js';
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from '../utils/apiResponse.js';
import cloudinary from "../config/cloudinary.js"


export const signup = asyncHandler(async (req, res) => {

  const { fullname, email, password } = req.body;

  // console.log(fullname, email, password)

  if (
    !fullname ||
    !email ||
    !password
  ) {
    throw new ApiError(
      400,
      "Fill all the fields."
    )
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // console.log("hello");
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email address")
  }

  const existEmail = await User.findOne({ email });

  if (existEmail) {
    throw new ApiError(400, "Email alredy exist")
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullname,
    email,
    password: hashPassword,
    avatar: {
      public_id: "",
      url: ""
    }
  })

  generateJWTToken(user, "User registed successfuly", 201, res)

})


export const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // console.log(email,password)

  if (!email || !password) {
    throw new ApiError(400, "Must fill all the fields")
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // console.log("hello");
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email address")
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User not found, please register.")
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(400, "Invalide Credentials")
  }

  generateJWTToken(user, "User loggedIn successfully.", 201, res)
})


export const signout = asyncHandler(async (req, res) => {
  return res.status(200).cookie("token", "", {
    httpOnly: true,
    maxAge: 0,
    sameSite: "strict",
    secure: true
  }).json({
    success: true,
    message: "User logged out successfully"
  })
})


export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(201).json(new ApiResponse(200, user))

})


export const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;


  if (email.trim().length == 0 || fullname.trim().length == 0) {
    throw new ApiError(400, "Fullname and email can't be empty.")
  }

  const avatar = req?.files?.avatar;
  let cloudinaryResponse = {}

  if (avatar) {
    try {
      const oldAvatarPublicId = req.user?.avatar?.public_id;
      if (oldAvatarPublicId && oldAvatarPublicId.length > 0) {
        await cloudinary.uploader.destroy(oldAvatarPublicId)
      }
      cloudinaryResponse = await cloudinary.uploader.upload(
        avatar.tempFilePath,
        {
          folder: "CHATAPP",
          transformation: [
            { width: 300, hight: 300, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ]
        })
    } catch (error) {
      console.log("Cloudinary upload error : ", error)
      throw new ApiError(400, "Faild to upload avatar.")
    }
  }

  let data = {
    fullname,
    email
  }

  if (avatar && cloudinaryResponse?.public_id && cloudinaryResponse?.secure_url) {
    data.avatar = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url
    }
  }

  let user = await User.findByIdAndUpdate(req.user._id, data, {
    new: true,
    runValidators: true
  })

  res.status(200).json(new ApiResponse(201, user, "Profile updated successfully."))

})

