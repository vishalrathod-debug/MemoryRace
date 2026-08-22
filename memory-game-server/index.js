// index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
app.disable("x-powered-by");
app.get("/health", (_request, response) => response.status(200).json({ status: "ok" }));

// Enable CORS so your React Native app can connect from anywhere
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  perMessageDeflate: false,
});

const SYMBOLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const rooms = new Map();
const ROOM_CODE_PATTERN = /^[A-Z0-9]{4,12}$/;

const normalizeRoomCode = (roomCode) => String(roomCode || "").trim().toUpperCase();

const makeDeck = () => [...SYMBOLS, ...SYMBOLS].sort(() => Math.random() - 0.5);
const makeGame = () => ({
  deck: makeDeck(),
  flippedIndices: [],
  matchedIndices: [],
  moves: 0,
  currentTurn: 0,
  locked: false,
});
const publicState = (room) => ({ ...room.game, players: room.players.length });
const broadcastState = (roomCode) => {
  const room = rooms.get(roomCode);
  if (room) io.to(roomCode).emit("room_state", publicState(room));
};
const fail = (socket, message) => socket.emit("error_message", message);

io.on("connection", (socket) => {
  socket.on("create_room", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);
    if (!ROOM_CODE_PATTERN.test(code)) return fail(socket, "Use 4 to 12 letters or numbers for the room code.");
    if (rooms.has(code)) return fail(socket, "That room code is already in use.");
    rooms.set(code, { players: [socket.id], game: makeGame(), clearMismatch: null });
    socket.join(code);
    socket.roomCode = code;
    broadcastState(code);
  });

  socket.on("join_room", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);
    if (!ROOM_CODE_PATTERN.test(code)) return fail(socket, "Use 4 to 12 letters or numbers for the room code.");
    const room = rooms.get(code);
    if (!room) return fail(socket, "Room not found.");
    if (room.players.length >= 2) return fail(socket, "This room is full.");
    room.players.push(socket.id);
    socket.join(code);
    socket.roomCode = code;
    broadcastState(code);
  });

  socket.on("flip_card", ({ roomCode, cardIndex }) => {
    const room = rooms.get(normalizeRoomCode(roomCode));
    if (!room || room.players.length !== 2) return;
    const playerIndex = room.players.indexOf(socket.id);
    const index = Number(cardIndex);
    const game = room.game;
    if (playerIndex !== game.currentTurn || game.locked || !Number.isInteger(index) || index < 0 || index >= game.deck.length || game.flippedIndices.includes(index) || game.matchedIndices.includes(index)) return;

    game.flippedIndices.push(index);
    if (game.flippedIndices.length === 1) return broadcastState(socket.roomCode);

    game.moves += 1;
    game.locked = true;
    const [first, second] = game.flippedIndices;
    if (game.deck[first] === game.deck[second]) {
      game.matchedIndices.push(first, second);
      game.flippedIndices = [];
      game.locked = false;
      return broadcastState(socket.roomCode);
    }

    broadcastState(socket.roomCode);
    room.clearMismatch = setTimeout(() => {
      const currentRoom = rooms.get(socket.roomCode);
      if (!currentRoom || currentRoom !== room) return;
      currentRoom.game.flippedIndices = [];
      currentRoom.game.locked = false;
      currentRoom.game.currentTurn = currentRoom.game.currentTurn === 0 ? 1 : 0;
      currentRoom.clearMismatch = null;
      broadcastState(socket.roomCode);
    }, 700);
  });

  socket.on("reset_game", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    if (!room || !room.players.includes(socket.id)) return;
    if (room.clearMismatch) clearTimeout(room.clearMismatch);
    room.game = makeGame();
    room.clearMismatch = null;
    broadcastState(code);
  });

  socket.on("disconnect", () => {
    const code = socket.roomCode;
    const room = code && rooms.get(code);
    if (!room) return;
    room.players = room.players.filter((id) => id !== socket.id);
    if (room.players.length === 0) {
      if (room.clearMismatch) clearTimeout(room.clearMismatch);
      rooms.delete(code);
    } else {
      room.game.currentTurn = 0;
      room.game.flippedIndices = [];
      room.game.locked = false;
      broadcastState(code);
    }
  });
});

/* Legacy signaling server retained below for reference.
// Store active rooms: { roomCode: [socketId1, socketId2] }
const rooms = {};

// Store user UIDs: { uid: socketId }
const userSockets = {};

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // 1️⃣ Register User UID
  socket.on("register_uid", ({ uid }) => {
    userSockets[uid] = socket.id;
    socket.uid = uid;
    console.log(`🆔 User registered: ${uid} -> ${socket.id}`);
  });

  // 2️⃣ Host creates a new room
  socket.on("create_room", ({ roomCode }) => {
    rooms[roomCode] = [socket.id];
    socket.join(roomCode);
    console.log(`🏠 Room created: ${roomCode} by ${socket.id}`);
    socket.emit("room_created", { roomCode });
  });

  // 3️⃣ Guest joins an existing room
  socket.on("join_room", ({ roomCode }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("error_message", "Room not found!");
      return;
    }

    if (room.length >= 2) {
      socket.emit("error_message", "Room is full!");
      return;
    }

    room.push(socket.id);
    socket.join(roomCode);
    console.log(`🤝 Player ${socket.id} joined room: ${roomCode}`);

    // Notify Host that a guest joined, so Host can initiate the WebRTC offer
    socket.to(roomCode).emit("player_joined", { guestId: socket.id });
  });

  // 4️⃣ Challenge a Friend directly via UID
  socket.on("send_challenge", ({ targetUid, roomCode }) => {
    const targetSocketId = userSockets[targetUid];
    if (targetSocketId) {
      io.to(targetSocketId).emit("receive_challenge", {
        fromUid: socket.uid,
        roomCode,
      });
    } else {
      socket.emit("error_message", "Friend is offline or UID is invalid.");
    }
  });

  // 5️⃣ WebRTC Signaling Relay: Swap Offers, Answers, and ICE Candidates
  socket.on("signal", ({ roomCode, data }) => {
    // Relay signal data to the other player in the room
    socket.to(roomCode).emit("signal", { data, senderId: socket.id });
  });

  // 6️⃣ Handle Disconnection
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    if (socket.uid) {
      delete userSockets[socket.uid];
    }
    // Clean up empty rooms
    for (const roomCode in rooms) {
      rooms[roomCode] = rooms[roomCode].filter((id) => id !== socket.id);
      if (rooms[roomCode].length === 0) {
        delete rooms[roomCode];
      } else {
        // Notify remaining player that partner left
        io.to(roomCode).emit("player_left");
      }
    }
  });
});

*/
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Signaling Server running on port ${PORT}`);
});
