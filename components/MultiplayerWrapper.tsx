import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Board from "../components/Board"; // 👈 Your existing Board component
import { useWebRTC } from "../logic/useWebRTC";

interface MultiplayerWrapperProps {
  serverUrl: string;
  roomCode: string;
  isHost: boolean;
}

export const MultiplayerWrapper: React.FC<MultiplayerWrapperProps> = ({
  serverUrl,
  roomCode,
  isHost,
}) => {
  const { game, status, error, sendCardFlip, resetGame } = useWebRTC(serverUrl, roomCode, isHost);
  const playerIndex = isHost ? 0 : 1;
  const canPress = status === "ready" && game?.currentTurn === playerIndex && !game.locked;
  const message = error
    ? error
    : status === "connecting"
      ? "Connecting to room..."
      : status === "waiting"
        ? "Waiting for another player..."
        : game && game.matchedIndices.length === game.deck.length
          ? "Round complete"
        : game?.currentTurn === playerIndex
          ? "Your turn"
          : "Opponent's turn";

  return (
    <View style={styles.container}>
      <View style={styles.roomBar}>
        <Text style={styles.roomLabel}>ROOM {roomCode}</Text>
        <Text style={styles.status}>{message}</Text>
      </View>
      <Board gameState={game} onCardPress={sendCardFlip} onReset={resetGame} canPress={Boolean(canPress)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F12" },
  roomBar: { alignItems: "center", paddingTop: 10, gap: 4 },
  roomLabel: { color: "#FAFAFA", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  status: { color: "#A1A1AA", fontSize: 13 },
});

/* Legacy wrapper retained below for reference.
interface MultiplayerWrapperProps {
  serverUrl: string;
  roomCode: string;
  isHost: boolean;
}

export const MultiplayerWrapper: React.FC<MultiplayerWrapperProps> = ({
  serverUrl,
  roomCode,
  isHost,
}) => {
  // Track opponent's last flipped card index
  const [remoteFlipIndex, setRemoteFlipIndex] = useState<number | null>(null);

  // 1️⃣ Catch incoming opponent moves over WebRTC
  const handleRemoteMove = useCallback((move: GameMove) => {
    if (move.type === "FLIP") {
      setRemoteFlipIndex(move.cardIndex);
    }
  }, []);

  // 2️⃣ WebRTC Hook
  const { isConnected, sendCardFlip } = useWebRTC(
    serverUrl,
    roomCode,
    isHost,
    handleRemoteMove
  );

  // 3️⃣ Send card flip to opponent when local player taps
  const handleLocalCardPress = (cardIndex: number) => {
    if (isConnected) {
      sendCardFlip(cardIndex);
    }
  };

  return (
    <Board
      /* ⚡ Passes props straight into your existing Board */
//       onCardPress={handleLocalCardPress}
//       remoteFlipIndex={remoteFlipIndex}
//       isConnected={isConnected}
//       roomCode={roomCode}
//     />
//   );
// };
// */
