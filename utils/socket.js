import { Server } from "socket.io";

const userSocketMap = {};
let io;

export function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL, // string, not array
            credentials: true,                // ✅ REQUIRED
            methods: ["GET", "POST", "PUT"],         // ✅ REQUIRED
        },
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (!userId || typeof userId !== "string") {
            console.log("Socket connected without valid userId");
            return;
        }

        userSocketMap[userId] = socket.id;
        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        socket.on("disconnect", () => {
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });
    });
}

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

export { io };
