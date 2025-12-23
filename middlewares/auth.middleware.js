import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";

const isAuthenticated = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
        return res.status(401).json({ message: "Unauthorized: Invalid token", success: false });
    }

    // console.log(decoded)
    const user = await User.findById(decoded.id);



    if (!user) {
        return res.status(404).json({ message: "User not found", success: false });
    }

    req.user = user; // ✅ Attach full user info

    next();

})

export default isAuthenticated;