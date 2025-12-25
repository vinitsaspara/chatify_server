import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import connectDB from "./config/db.js";
import userRouters from "./routes/user.routes.js";
import messageRouters from "./routes/message.routes.js";
import http from "http";
import { initSocket } from "./utils/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- CORS (FIXED & SAFE) -------------------- */
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://chatify-client.vercel.app",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
/* ------------------------------------------------------------ */

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./temp/",
  })
);

/* -------------------- ROUTES -------------------- */
app.use("/api/v1/user", userRouters);
app.use("/api/v1/message", messageRouters);
/* ------------------------------------------------ */

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port : ${PORT}`);
});
