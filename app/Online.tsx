import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MultiplayerWrapper } from "../components/MultiplayerWrapper";

type Mode = "host" | "guest";

const makeRoomCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();

// 🔒 Live Render Server URL
const SERVER_URL =
  process.env.EXPO_PUBLIC_GAME_SERVER_URL ??
  "https://memoryrace.onrender.com";

export default function Online() {
  const [roomCode, setRoomCode] = useState(makeRoomCode());
  const [mode, setMode] = useState<Mode | null>(null);

  const isReady = /^[A-Z0-9]{4,12}$/.test(roomCode.trim());

  const handleHostGame = () => {
    if (!roomCode) setRoomCode(makeRoomCode());
    setMode("host");
  };

  const handleJoinGame = () => {
    if (!roomCode.trim()) {
      Alert.alert("Missing Room Code", "Please enter a room code to join.");
      return;
    }
    setMode("guest");
  };

  const handleLeaveRoom = () => {
    setMode(null);
  };

  // 🎮 Active Game View
  if (mode) {
    return (
      <SafeAreaView style={styles.game}>
        <View style={styles.headerBar}>
          <Pressable style={styles.leaveButton} onPress={handleLeaveRoom}>
            <Text style={styles.leaveText}>← LEAVE ROOM</Text>
          </Pressable>
          <Text style={styles.headerRoomCode}>ROOM: {roomCode}</Text>
        </View>

        <MultiplayerWrapper
          serverUrl={SERVER_URL}
          roomCode={roomCode.trim().toUpperCase()}
          isHost={mode === "host"}
          onLeave={handleLeaveRoom}
        />
      </SafeAreaView>
    );
  }

  // 🚪 Clean Lobby UI
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ONLINE MATCH</Text>
        <Text style={styles.subtitle}>
          Create a room or enter a friend's code to join.
        </Text>

        <View style={styles.labelRow}>
          <Text style={styles.label}>ROOM CODE</Text>
          <Pressable onPress={() => setRoomCode(makeRoomCode())}>
            <Text style={styles.generateText}>⚡ GENERATE</Text>
          </Pressable>
        </View>

        <TextInput
          value={roomCode}
          onChangeText={(value) =>
            setRoomCode(value.toUpperCase().slice(0, 12))
          }
          autoCapitalize="characters"
          maxLength={12}
          placeholder="ENTER ROOM CODE"
          placeholderTextColor="#71717A"
          style={styles.input}
        />

        <Pressable
          disabled={!isReady}
          style={[styles.primaryButton, !isReady && styles.buttonDisabled]}
          onPress={handleHostGame}
        >
          <Text style={styles.primaryText}>CREATE ROOM (HOST)</Text>
        </Pressable>

        <Pressable
          disabled={!isReady}
          style={[styles.secondaryButton, !isReady && styles.buttonDisabled]}
          onPress={handleJoinGame}
        >
          <Text style={styles.secondaryText}>JOIN ROOM (GUEST)</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  game: { flex: 1, backgroundColor: "#0F0F12" },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#18181C",
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  leaveButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  leaveText: { color: "#FF5252", fontWeight: "700", fontSize: 13 },
  headerRoomCode: { color: "#A1A1AA", fontWeight: "700", fontSize: 13 },
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#0F0F12",
    padding: 24,
  },
  content: { width: "100%", maxWidth: 420, alignSelf: "center" },
  title: {
    color: "#FAFAFA",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "#D4D4D8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  generateText: {
    color: "#50E3C2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  input: {
    color: "#FAFAFA",
    backgroundColor: "#18181C",
    borderColor: "#3F3F46",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#50E3C2",
    borderRadius: 6,
    paddingVertical: 15,
    marginTop: 4,
  },
  primaryText: { color: "#06241E", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#52525B",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 15,
    marginTop: 12,
  },
  secondaryText: { color: "#FAFAFA", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  buttonDisabled: { opacity: 0.45 },
});