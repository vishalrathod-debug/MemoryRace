import { createAudioPlayer } from "expo-audio";

// 1. Require local audio assets 🎵
const countdownSound = require("../assets/sounds/countdown.mp3");
const matchSound = require("../assets/sounds/match.mp3");
const mismatchSound = require("../assets/sounds/mismatch.mp3");
const startSound = require("../assets/sounds/start.mp3");
const winSound = require("../assets/sounds/win.mp3");

// 2. Instantiate dedicated players 🔊
const players = {
  countdown: createAudioPlayer(countdownSound),
  start: createAudioPlayer(startSound),
  match: createAudioPlayer(matchSound),
  mismatch: createAudioPlayer(mismatchSound),
  win: createAudioPlayer(winSound),
};

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

// Rewind to start (0s) and play 🔁
const replay = (player: ReturnType<typeof createAudioPlayer>) => {
  if (!soundEnabled) return;
  player.seekTo(0);
  player.play();
};

export function playCountdownSound() {
  replay(players.countdown);
}

export function playStartSound() {
  replay(players.start);
}

export function playMatchSound() {
  replay(players.match);
}

export function playMismatchSound() {
  replay(players.mismatch);
}

export function playWinSound() {
  replay(players.win);
}
