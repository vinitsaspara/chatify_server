import jwt from "jsonwebtoken";

export const generateJWTToken = async (user, message, statuscode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRY }
  );

  return res
    .status(statuscode)
    .cookie("token", token, {
      httpOnly: true,
      secure: true,          // ✅ MUST be true in production
      sameSite: "none",      // ✅ MUST be 'none' for cross-origin
      maxAge: Number(process.env.COOKIE_EXPIRY) * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message,
      user,
      // ❌ Do NOT send token in response body in prod (optional)
    });
};
