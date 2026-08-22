import { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

export interface GameState {
  deck: string[];
  flippedIndices: number[];
  matchedIndices: number[];
  moves: number;
  currentTurn: 0 | 1;
  locked: boolean;
  players: number;
}

type ConnectionStatus = "connecting" | "waiting" | "ready" | "disconnected";

/** Keeps game state authoritative on the server for identical boards on both devices. */
export const useWebRTC = (serverUrl: string, roomCode: string, isHost: boolean) => {
  const [game, setGame] = useState<GameState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!serverUrl || !roomCode) return;

    setStatus("connecting");
    setError(null);
    const socket = io(serverUrl, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit(isHost ? "create_room" : "join_room", { roomCode }));
    socket.on("room_state", (nextGame: GameState) => {
      setGame(nextGame);
      setStatus(nextGame.players === 2 ? "ready" : "waiting");
    });
    socket.on("error_message", (message: string) => {
      setError(message);
      setStatus("disconnected");
    });
    socket.on("connect_error", () => {
      setError("Could not reach the game server.");
      setStatus("disconnected");
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl, roomCode, isHost]);

  const sendCardFlip = useCallback((cardIndex: number) => {
    socketRef.current?.emit("flip_card", { roomCode, cardIndex });
  }, [roomCode]);
  const resetGame = useCallback(() => {
    socketRef.current?.emit("reset_game", { roomCode });
  }, [roomCode]);

  return { game, status, error, sendCardFlip, resetGame };
};

/* Legacy WebRTC implementation retained below for reference.

// 🌐 STUN server configuration object
const peerConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// 📦 Custom interface for signaling payloads swapped via Socket.io
interface SignalPayload {
  sdp?: {
    type: "offer" | "answer" | "pranswer" | "rollback";
    sdp: string;
  };
  candidate?: {
    candidate: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
  };
}

// 🃏 Data payload structure for P2P messages sent across devices
export interface GameMove {
  type: "FLIP" | "MATCH" | "RESET";
  cardIndex: number;
}

export const useWebRTC = (
  serverUrl: string,
  roomCode: string,
  isHost: boolean,
  onMoveReceived?: (move: GameMove) => void,
) => {
  const [dataChannel, setDataChannel] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const pc = useRef<RTCPeerConnection | null>(null);
  const socket = useRef<Socket | null>(null);

  // 1️⃣ Helper to configure and listen to the DataChannel
  const setupDataChannel = useCallback(
    (dc: any) => {
      dc.onopen = () => {
        console.log("⚡ Direct Peer-to-Peer DataChannel Connected!");
        setIsConnected(true);
      };

      dc.onmessage = (event: { data: string }) => {
        try {
          const move: GameMove = JSON.parse(event.data);
          console.log("📩 Received Game Move:", move);
          if (onMoveReceived) {
            onMoveReceived(move);
          }
        } catch (error) {
          console.error("Error parsing game move:", error);
        }
      };

      setDataChannel(dc);
    },
    [onMoveReceived],
  );

  useEffect(() => {
    if (!serverUrl || !roomCode) return;

    // Connect to Render signaling server & initialize Peer Connection
    socket.current = io(serverUrl);
    pc.current = new RTCPeerConnection(peerConfiguration);

    // 2️⃣ Relay local ICE candidate network info to peer
    pc.current.onicecandidate = (event: any) => {
      if (event.candidate && socket.current) {
        const candidateData = event.candidate.toJSON
          ? event.candidate.toJSON()
          : event.candidate;
        socket.current.emit("signal", {
          roomCode,
          data: { candidate: candidateData },
        });
      }
    };

    if (isHost) {
      // 3️⃣ Host creates the DataChannel & sends offer upon Guest joining
      const dc = pc.current.createDataChannel("gameChannel");
      setupDataChannel(dc);

      socket.current.on("player_joined", async () => {
        if (!pc.current || !socket.current) return;
        const offer = await pc.current.createOffer({});
        await pc.current.setLocalDescription(offer);
        socket.current.emit("signal", { roomCode, data: { sdp: offer } });
      });
    } else {
      // 4️⃣ Guest listens for incoming DataChannel created by Host
      pc.current.ondatachannel = (event: any) => {
        setupDataChannel(event.channel);
      };
    }

    // 5️⃣ Process incoming WebRTC signaling data
    socket.current.on("signal", async ({ data }: { data: SignalPayload }) => {
      if (!pc.current) return;

      if (data.sdp) {
        await pc.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        );
        if (data.sdp.type === "offer") {
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          if (socket.current) {
            socket.current.emit("signal", { roomCode, data: { sdp: answer } });
          }
        }
      } else if (data.candidate) {
        await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    return () => {
      socket.current?.disconnect();
      pc.current?.close();
    };
  }, [serverUrl, roomCode, isHost, setupDataChannel]);

  // 6️⃣ Function to transmit card flips directly to the peer
  const sendCardFlip = (cardIndex: number) => {
    if (dataChannel && dataChannel.readyState === "open") {
      const move: GameMove = { type: "FLIP", cardIndex };
      dataChannel.send(JSON.stringify(move));
    }
  };

  return { isConnected, sendCardFlip };
};
*/
