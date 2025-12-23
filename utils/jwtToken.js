import jwt from "jsonwebtoken"

export const generateJWTToken = async (user, message, statuscode, res) => {
    const token = jwt.sign({
        id: user._id,
    },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn: process.env.JWT_EXPIRY
        })

    return res.status(statuscode).cookie("token",token,{
        httpOnly: true,
        maxAge: process.env.COOKIE_EXPIRY * 24 * 60 * 60 * 1000,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development" ? true : false
    }).json({
        success: true,
        message,
        user,
        token
    })
} 