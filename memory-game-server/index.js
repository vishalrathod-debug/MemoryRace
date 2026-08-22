const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

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

const normalizeRoomCode = (roomCode) =>
  String(roomCode || "")
    .trim()
    .toUpperCase();

const makeDeck = () => {
  return [...SYMBOLS, ...SYMBOLS].sort(() => Math.random() - 0.5);
};

const makeGame = () => ({
  deck: makeDeck(),
  flippedIndices: [],
  matchedIndices: [],
  scores: [0, 0],
  moves: 0,
  currentTurn: 0,
  locked: false,
});

const publicState = (room) => ({
  ...room.game,

  // Send a new array instead of exposing the room's array directly.
  scores: [...room.game.scores],

  players: room.players.length,
});

const broadcastState = (roomCode) => {
  const room = rooms.get(roomCode);

  if (!room) return;

  io.to(roomCode).emit("room_state", publicState(room));
};

const fail = (socket, message) => {
  socket.emit("error_message", message);
};

io.on("connection", (socket) => {
  /*
   * CREATE ROOM
   */
  socket.on("create_room", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);

    if (!ROOM_CODE_PATTERN.test(code)) {
      return fail(socket, "Use 4 to 12 letters or numbers for the room code.");
    }

    if (rooms.has(code)) {
      return fail(socket, "That room code is already in use.");
    }

    rooms.set(code, {
      players: [socket.id],
      game: makeGame(),
      clearMismatch: null,
    });

    socket.join(code);
    socket.roomCode = code;

    broadcastState(code);
  });

  /*
   * JOIN ROOM
   */
  socket.on("join_room", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);

    if (!ROOM_CODE_PATTERN.test(code)) {
      return fail(socket, "Use 4 to 12 letters or numbers for the room code.");
    }

    const room = rooms.get(code);

    if (!room) {
      return fail(socket, "Room not found.");
    }

    if (room.players.length >= 2) {
      return fail(socket, "This room is full.");
    }

    room.players.push(socket.id);

    socket.join(code);
    socket.roomCode = code;

    broadcastState(code);
  });

  /*
   * FLIP CARD
   */
  socket.on("flip_card", ({ roomCode, cardIndex }) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);

    if (!room) return;

    /*
     * Make sure this socket actually belongs to this room.
     */
    const playerIndex = room.players.indexOf(socket.id);

    if (playerIndex === -1) {
      return;
    }

    /*
     * Both players must be connected before the game can start.
     */
    if (room.players.length !== 2) {
      return;
    }

    const game = room.game;
    const index = Number(cardIndex);

    /*
     * Only the player whose turn it is can play.
     */
    if (playerIndex !== game.currentTurn) {
      return;
    }

    /*
     * Do not allow input while the second card is being evaluated.
     */
    if (game.locked) {
      return;
    }

    /*
     * Validate card index.
     */
    if (!Number.isInteger(index)) {
      return;
    }

    if (index < 0 || index >= game.deck.length) {
      return;
    }

    /*
     * Do not allow already flipped cards.
     */
    if (game.flippedIndices.includes(index)) {
      return;
    }

    /*
     * Do not allow already matched cards.
     */
    if (game.matchedIndices.includes(index)) {
      return;
    }

    /*
     * Add the selected card.
     */
    game.flippedIndices.push(index);

    /*
     * FIRST CARD
     *
     * Just broadcast the new state.
     */
    if (game.flippedIndices.length === 1) {
      return broadcastState(code);
    }

    /*
     * SECOND CARD
     */
    game.moves += 1;
    game.locked = true;

    const [first, second] = game.flippedIndices;

    /*
     * MATCH
     */
    if (game.deck[first] === game.deck[second]) {
      game.matchedIndices.push(first, second);

      game.flippedIndices = [];

      /*
       * IMPORTANT:
       *
       * Replace the scores array instead of mutating it directly.
       *
       * Example:
       * Player 0: [2, 1]
       * Player 0 gets a match:
       *          [3, 1]
       */
      game.scores = game.scores.map((score, index) =>
        index === playerIndex ? score + 1 : score,
      );

      /*
       * Player keeps the turn after a successful match.
       */
      game.locked = false;

      /*
       * Send updated score immediately to BOTH players.
       */
      return broadcastState(code);
    }

    /*
     * MISMATCH
     *
     * Send the state while both cards are visible.
     */
    broadcastState(code);

    /*
     * Hide the cards after 700ms and switch turns.
     */
    room.clearMismatch = setTimeout(() => {
      const currentRoom = rooms.get(code);

      /*
       * Room may have disappeared while waiting.
       */
      if (!currentRoom) {
        return;
      }

      /*
       * Make sure this is still the same room.
       */
      if (currentRoom !== room) {
        return;
      }

      currentRoom.game.flippedIndices = [];

      currentRoom.game.locked = false;

      currentRoom.game.currentTurn = currentRoom.game.currentTurn === 0 ? 1 : 0;

      currentRoom.clearMismatch = null;

      broadcastState(code);
    }, 700);
  });

  /*
   * RESET GAME
   */
  socket.on("reset_game", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);

    if (!room) {
      return;
    }

    /*
     * Only players inside the room can reset it.
     */
    if (!room.players.includes(socket.id)) {
      return;
    }

    /*
     * Cancel any pending mismatch timer.
     */
    if (room.clearMismatch) {
      clearTimeout(room.clearMismatch);
    }

    /*
     * Completely create a new game.
     */
    room.game = makeGame();
    room.clearMismatch = null;

    broadcastState(code);
  });

  /*
   * PLAYER DISCONNECT
   */
  socket.on("disconnect", () => {
    const code = socket.roomCode;
    const room = code && rooms.get(code);

    if (!room) {
      return;
    }

    /*
     * Cancel mismatch timer.
     */
    if (room.clearMismatch) {
      clearTimeout(room.clearMismatch);
    }

    /*
     * Remove disconnected player.
     */
    room.players = room.players.filter((id) => id !== socket.id);

    /*
     * Nobody remains.
     */
    if (room.players.length === 0) {
      rooms.delete(code);
      return;
    }

    /*
     * One player remains.
     *
     * Reset the game and wait for another player.
     */
    room.game = makeGame();
    room.clearMismatch = null;

    broadcastState(code);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Signaling Server running on port ${PORT}`);
});
