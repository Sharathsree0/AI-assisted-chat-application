// import { io } from "socket.io-client";

// const MY_ID = "696e0aaf82bcea747dc86311";
// const OTHER_ID ="696dfb27c4abd30ab81a7076";

// const socket = io("http://localhost:5000", {
//   auth: { userId: MY_ID }
// });
// console.log("ONLINE USERS 👉", onlineUsers);

// socket.on("connect", () => {
//   console.log("CONNECTED AS", MY_ID, socket.id);
// console.log("USER CONNECTED 👉", userId);

//   setTimeout(() => {
//     console.log("EMITTING typing-start");
//     socket.emit("typing-start", {
//       fromUserId: MY_ID,
//       toUserId: OTHER_ID
//     });
//   }, 3000);

//   setTimeout(() => {
//     console.log("EMITTING send-message");
//     console.log("FROM 👉", fromUserId);
// console.log("TO 👉", toUserId);
// console.log("TARGET SOCKET 👉", targetSocketId);

//     socket.emit("send-message", {
//       fromUserId: MY_ID,
//       toUserId: OTHER_ID,
//       message: "Hello 👋"
//     });
//   }, 4000);

//   setTimeout(() => {
//     console.log("EMITTING typing-stop");
//     socket.emit("typing-stop", {
//       fromUserId: MY_ID,
//       toUserId: OTHER_ID
//     });
//   }, 6000);
// });

// socket.on("typing-start", (userId) => {
//   console.log("RECEIVED typing-start FROM", userId);
// });

// socket.on("typing-stop", (userId) => {
//   console.log(" RECEIVED typing-stop FROM", userId);
// });

// socket.on("receive-message", ({ fromUserId, message }) => {
//   console.log(`💬 ${fromUserId}: ${message}`);
// });
