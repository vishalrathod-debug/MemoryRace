import { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

export interface GameState {
  deck: string[];
  flippedIndices: number[];
  matchedIndices: number[];
  scores: [number, number];
  moves: number;
  currentTurn: 0 | 1;
  locked: boolean;
  players: number;
}

type ConnectionStatus = "connecting" | "waiting" | "ready" | "disconnected";

const isValidGameState = (state: GameState): boolean => {
  return (
    Array.isArray(state.deck) &&
    Array.isArray(state.flippedIndices) &&
    Array.isArray(state.matchedIndices) &&
    Array.isArray(state.scores) &&
    state.scores.length === 2 &&
    typeof state.moves === "number" &&
    (state.currentTurn === 0 || state.currentTurn === 1) &&
    typeof state.locked === "boolean" &&
    typeof state.players === "number"
  );
};

/**
 * Keeps the game state authoritative on the server.
 *
 * Both players receive the same room_state from the server.
 */
export const useWebRTC = (
  serverUrl: string,
  roomCode: string,
  isHost: boolean,
) => {
  const [game, setGame] = useState<GameState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!serverUrl || !roomCode) {
      return;
    }

    setStatus("connecting");
    setError(null);
    setGame(null);

    const socket = io(serverUrl, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    /*
     * CONNECT
     */
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      socket.emit(isHost ? "create_room" : "join_room", {
        roomCode,
      });
    });

    /*
     * SERVER GAME STATE
     *
     * This is the important event for scores.
     *
     * The server sends:
     *
     * {
     *   deck,
     *   flippedIndices,
     *   matchedIndices,
     *   scores,
     *   moves,
     *   currentTurn,
     *   locked,
     *   players
     * }
     */
    socket.on("room_state", (nextGame: GameState) => {
      if (!isValidGameState(nextGame)) {
        console.warn("Received invalid game state:", nextGame);
        return;
      }

      console.log(
        "ROOM STATE:",
        "scores =",
        nextGame.scores,
        "moves =",
        nextGame.moves,
        "turn =",
        nextGame.currentTurn,
      );

      /*
       * Create a new state object and a new scores array.
       *
       * This guarantees React receives a new reference.
       */
      const safeGame: GameState = {
        ...nextGame,
        deck: [...nextGame.deck],
        flippedIndices: [...nextGame.flippedIndices],
        matchedIndices: [...nextGame.matchedIndices],
        scores: [nextGame.scores[0], nextGame.scores[1]],
      };

      setGame(safeGame);

      setStatus(nextGame.players === 2 ? "ready" : "waiting");
    });

    /*
     * SERVER ERROR
     */
    socket.on("error_message", (message: string) => {
      console.log("Server error:", message);

      setError(message);
      setStatus("disconnected");
    });

    /*
     * CONNECTION ERROR
     */
    socket.on("connect_error", (connectionError) => {
      console.log("Socket connection error:", connectionError.message);

      setError("Could not reach the game server.");

      setStatus("disconnected");
    });

    /*
     * DISCONNECT
     */
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);

      setStatus("disconnected");
    });

    /*
     * CLEANUP
     */
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl, roomCode, isHost]);

  /*
   * FLIP CARD
   */
  const sendCardFlip = useCallback(
    (cardIndex: number) => {
      const socket = socketRef.current;

      if (!socket) {
        return;
      }

      if (!socket.connected) {
        return;
      }

      socket.emit("flip_card", {
        roomCode,
        cardIndex,
      });
    },
    [roomCode],
  );

  /*
   * RESET GAME
   */
  const resetGame = useCallback(() => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    if (!socket.connected) {
      return;
    }

    socket.emit("reset_game", {
      roomCode,
    });
  }, [roomCode]);

  return {
    game,
    status,
    error,
    sendCardFlip,
    resetGame,
  };
};
