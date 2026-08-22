import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark
    ? { background: "#0F0F12", surface: "#18181C", text: "#FAFAFA", muted: "#2A2A30" }
    : { background: "#F6F7FB", surface: "#FFFFFF", text: "#18181C", muted: "#D4D4D8" };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        accessibilityLabel={isDark ? "Switch to light theme" : "Switch to dark theme"}
        onPress={() => setIsDark((dark) => !dark)}
        style={[styles.themeButton, { backgroundColor: theme.surface, borderColor: theme.muted }]}
      >
        <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={isDark ? "#50E3C2" : "#2563EB"} />
      </Pressable>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>MEMORY</Text>
        <Text style={[styles.title, { color: theme.text }]}>RACE</Text>
      </View>

      {/* 2. Hero Illustration Section */}
      <View style={styles.heroContainer}>
        <Image 
          source={require("../assets/images/brain_hero.png")} 
          style={styles.heroGraphic}
          resizeMode="contain" 
        />
      </View>

      {/* 3. Game Mode Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push("/SinglePalyer")}
        >
          <View style={[styles.dot, styles.soloDot]} />
          <Text style={[styles.buttonText, { color: theme.text }]}>SOLO PLAY</Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: theme.muted }]} />

        <Pressable 
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push("/Online")}
        >
          <View style={[styles.dot, styles.onlineDot]} />
          <Text style={[styles.buttonText, { color: theme.text }]}>1v1 ONLINE</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F12",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
  },
  themeButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 6,
    zIndex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: "300",
    letterSpacing: 4,
    color: "#FAFAFA",
    fontFamily: "System",
  },
  heroContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    width: '100%',
    height: 250, // Define a space for the graphic
  },
  heroGraphic: {
    width: "70%", // Adjust relative width to fit well
    height: "100%", 
  },
  buttonContainer: {
    width: "80%",
    alignItems: "center",
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    width: "100%",
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
    color: "#FAFAFA",
    marginLeft: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  soloDot: {
    backgroundColor: "#60A5FA",
  },
  onlineDot: {
    backgroundColor: "#50E3C2",
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A30",
    width: "100%",
    marginVertical: 8,
  },
});
