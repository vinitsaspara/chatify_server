import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Message } from "../models/message.model.js"
import cloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../utils/socket.js";

export const getAllUsers = asyncHandler(async (req, res) => {
    const user = req.user;
    const filteredUsers = await User.find({
        _id: {
            $ne: user
        }
    }).select("-password")

    res.json(new ApiResponse(200, filteredUsers, "Users fatched successfully."))
})


export const getMessages = asyncHandler(async (req, res) => {
    const receiverId = req.params.id;
    const myId = req.user._id;

    const receiver = await User.findById(receiverId)

    if (!receiver) {
        throw new ApiError(400, "Receiver ID Invalid.")
    }

    const messages = await Message.find({
        $or: [
            { senderId: myId, receiverId: receiverId },
            { senderId: receiverId, receiverId: myId }
        ]
    }).sort({ createdAt: 1 });

    res.json(new ApiResponse(200, messages, "Messages fatched successfully."))
})


export const sendMessages = asyncHandler(async (req, res) => {
    const text = req.body?.text || "";
    const media = req.files?.media;

    if (!text && !media) {
        return res.status(400).json({
            success: false,
            message: "Message or media required",
        });
    }

    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
        throw new ApiError(400, "Receiver ID Invalid.");
    }

    const sanitizedText = text?.trim() || "";

    if (!sanitizedText && !media) {
        throw new ApiError(400, "Can't send empty message.");
    }

    let mediaUrl = "";

    if (media) {
        try {
            const uploadResponse = await cloudinary.uploader.upload(
                media.tempFilePath, // ✅ works only with useTempFiles: true
                {
                    resource_type: "auto",
                    folder: "CHATAPP_MEDIA",
                }
            );

            mediaUrl = uploadResponse.secure_url;
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            throw new ApiError(400, "Failed to upload media.");
        }
    }

    const newMessage = await Message.create({
        senderId,
        receiverId,
        text: sanitizedText,
        media: mediaUrl,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({
        success: true,
        message: newMessage,
    });
});


