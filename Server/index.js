const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoute");
const messageRoute = require("./routes/messageRoute");
const app = express();
const socket = require("socket.io");
const path = require("path");

//config env
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/message/", messageRoute);

//static files
app.use(express.static(path.join(__dirname, "./Public/build")));
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./Public/build/index.html"));
});

//connecting to database

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch(() => {
    console.log(err.message);
  });

// connecting to port
const server = app.listen(process.env.PORT, () => {
  console.log(`server is running on PORT number ${process.env.PORT}`);
});

//Connecting with socket for realtime chatting
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    Credential: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
