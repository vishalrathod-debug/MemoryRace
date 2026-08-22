import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MultiplayerWrapper } from "../components/MultiplayerWrapper";

type Mode = "host" | "guest";

const makeRoomCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_GAME_SERVER_URL ?? "http://10.0.2.2:3000";

export default function Online() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [roomCode, setRoomCode] = useState(makeRoomCode());
  const [mode, setMode] = useState<Mode | null>(null);
  const isReady = Boolean(serverUrl.trim()) && /^[A-Z0-9]{4,12}$/.test(roomCode.trim());

  if (mode) {
    return (
      <SafeAreaView style={styles.game}>
        <MultiplayerWrapper serverUrl={serverUrl.trim()} roomCode={roomCode.trim().toUpperCase()} isHost={mode === "host"} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ONLINE MATCH</Text>
        <Text style={styles.subtitle}>Create a room or join one with a room code.</Text>
        <Text style={styles.label}>SERVER URL</Text>
        <TextInput
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://your-server.example"
          placeholderTextColor="#71717A"
          style={styles.input}
        />
        <Text style={styles.label}>ROOM CODE</Text>
        <TextInput
          value={roomCode}
          onChangeText={(value) => setRoomCode(value.toUpperCase().slice(0, 12))}
          autoCapitalize="characters"
          maxLength={12}
          placeholder="ABCDE"
          placeholderTextColor="#71717A"
          style={styles.input}
        />
        <Pressable disabled={!isReady} style={[styles.primaryButton, !isReady && styles.buttonDisabled]} onPress={() => setMode("host")}>
          <Text style={styles.primaryText}>CREATE ROOM</Text>
        </Pressable>
        <Pressable disabled={!isReady} style={[styles.secondaryButton, !isReady && styles.buttonDisabled]} onPress={() => setMode("guest")}>
          <Text style={styles.secondaryText}>JOIN ROOM</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  game: { flex: 1, backgroundColor: "#0F0F12" },
  container: { flex: 1, justifyContent: "center", backgroundColor: "#0F0F12", padding: 24 },
  content: { width: "100%", maxWidth: 420, alignSelf: "center" },
  title: { color: "#FAFAFA", fontSize: 28, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  subtitle: { color: "#A1A1AA", fontSize: 15, lineHeight: 22, marginBottom: 32 },
  label: { color: "#D4D4D8", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  input: { color: "#FAFAFA", backgroundColor: "#18181C", borderColor: "#3F3F46", borderWidth: 1, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, marginBottom: 20 },
  primaryButton: { alignItems: "center", backgroundColor: "#50E3C2", borderRadius: 6, paddingVertical: 15, marginTop: 4 },
  primaryText: { color: "#06241E", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  secondaryButton: { alignItems: "center", borderColor: "#52525B", borderWidth: 1, borderRadius: 6, paddingVertical: 15, marginTop: 12 },
  secondaryText: { color: "#FAFAFA", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  buttonDisabled: { opacity: 0.45 },
});

/* Legacy route retained below for reference.

interface OnlineProps {
  serverUrl: string;
  roomCode: string;
  isHost: boolean;
}

export const Online: React.FC<OnlineProps> = ({
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

  // 2️⃣ Connect to WebRTC
  const { isConnected, sendCardFlip } = useWebRTC(
    serverUrl,
    roomCode,
    isHost,
    handleRemoteMove
  );

  // 3️⃣ Send card flip to peer when local player taps
  const handleLocalCardPress = (cardIndex: number) => {
    if (isConnected) {
      sendCardFlip(cardIndex);
    }
  };

  return (
    <Board
      onCardPress={handleLocalCardPress}
      remoteFlipIndex={remoteFlipIndex}
      isConnected={isConnected}
      roomCode={roomCode}
    />
  );
};

export default Online;
*/
