import generateDeck from "@/logic/generateDeck";
import type { GameState } from "@/logic/useWebRTC";
import {
  playMatchSound,
  playMismatchSound,
  playStartSound,
  playWinSound,
  setSoundEnabled,
} from "@/utils/audio";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Card from "./Card";

// 10 pairs = 20 cards total
const DEFAULT_PAIRS = 10;
const GAP = 8;
const PADDING = 16;

type BoardProps = {
  gameState?: GameState | null;
  onCardPress?: (index: number) => void;
  onReset?: () => void;
  canPress?: boolean;
  pairCount?: number;
};

const Board = ({
  gameState,
  onCardPress,
  onReset,
  canPress = true,
  pairCount = DEFAULT_PAIRS,
}: BoardProps) => {
  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  // -----------------------------
  // LOCAL GAME STATE
  // -----------------------------
  const [cards, setCards] = useState<string[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [isBoardLocked, setIsBoardLocked] =
    useState<boolean>(false);

  // -----------------------------
  // LOCAL GAME STATS
  // -----------------------------
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] =
    useState<boolean>(false);

  const [soundEnabled, setLocalSoundEnabled] =
    useState(true);

  /*
   * If gameState exists, the board is controlled by
   * the multiplayer server.
   *
   * If gameState is undefined, this is a local game.
   */
  const isControlled = gameState !== undefined;

  // -----------------------------
  // DISPLAYED GAME STATE
  // -----------------------------

  /*
   * Multiplayer:
   *     gameState.deck
   *
   * Local:
   *     cards
   */
  const displayedCards =
    gameState?.deck ?? cards;

  /*
   * Multiplayer:
   *     gameState.flippedIndices
   *
   * Local:
   *     flippedIndices
   */
  const displayedFlippedIndices =
    gameState?.flippedIndices ??
    flippedIndices;

  /*
   * Multiplayer:
   *     gameState.matchedIndices
   *
   * Local:
   *     matchedIndices
   */
  const displayedMatchedIndices =
    gameState?.matchedIndices ??
    matchedIndices;

  /*
   * Multiplayer:
   *     server moves
   *
   * Local:
   *     local moves
   */
  const displayedMoves =
    gameState?.moves ?? moves;

  // -----------------------------
  // BOARD SIZE
  // -----------------------------

  const columns =
    displayedCards.length > 30
      ? 6
      : displayedCards.length > 20
      ? 5
      : 4;

  const rows =
    Math.ceil(
      displayedCards.length / columns,
    );

  const availableWidth =
    Math.min(screenWidth, 420) -
    PADDING * 2;

  const cardWidth = Math.floor(
    (availableWidth -
      GAP * (columns - 1)) /
      columns,
  );

  const availableGridHeight =
    Math.max(
      160,
      screenHeight - 220,
    );

  const cardHeight = Math.max(
    44,
    Math.min(
      Math.floor(cardWidth * 1.2),
      Math.floor(
        (availableGridHeight -
          GAP * (rows - 1)) /
          rows,
      ),
    ),
  );

  // -----------------------------
  // LOCAL GAME INITIALIZATION
  // -----------------------------

  useEffect(() => {
    /*
     * Multiplayer does not generate its own deck.
     *
     * The server provides the deck through gameState.
     */
    if (isControlled) {
      return;
    }

    const data =
      generateDeck(pairCount);

    setCards(data);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setMoves(0);
    setSeconds(0);
    setIsTimerRunning(false);
    setIsBoardLocked(false);

    playStartSound();
  }, [isControlled, pairCount]);

  // -----------------------------
  // SOUND
  // -----------------------------

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // -----------------------------
  // LOCAL TIMER
  // -----------------------------

  useEffect(() => {
    let interval:
      | ReturnType<typeof setInterval>
      | undefined;

    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds(
          (currentSeconds) =>
            currentSeconds + 1,
        );
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning]);

  // -----------------------------
  // LOCAL WIN CHECK
  // -----------------------------

  useEffect(() => {
    /*
     * Only local games use this win check.
     *
     * Multiplayer game-over is handled by
     * MultiplayerWrapper using server state.
     */
    if (
      !isControlled &&
      cards.length > 0 &&
      matchedIndices.length ===
        cards.length
    ) {
      setIsTimerRunning(false);
      playWinSound();
    }
  }, [
    matchedIndices,
    cards,
    isControlled,
  ]);

  // -----------------------------
  // RESET LOCAL GAME
  // -----------------------------

  const resetGame = () => {
    const data =
      generateDeck(pairCount);

    setCards(data);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setMoves(0);
    setSeconds(0);
    setIsTimerRunning(false);
    setIsBoardLocked(false);

    playStartSound();
  };

  // -----------------------------
  // CARD PRESS
  // -----------------------------

  const handleCardPress = (
    index: number,
  ) => {
    /*
     * ---------------------------
     * MULTIPLAYER
     * ---------------------------
     *
     * Board does NOT implement
     * multiplayer game rules.
     *
     * It simply sends the card
     * index to the server.
     */
    if (isControlled) {
      if (canPress) {
        onCardPress?.(index);
      }

      return;
    }

    /*
     * ---------------------------
     * LOCAL GAME
     * ---------------------------
     */

    if (
      isBoardLocked ||
      flippedIndices.includes(index) ||
      matchedIndices.includes(index)
    ) {
      return;
    }

    /*
     * Start timer when first card
     * is selected.
     */
    if (
      !isTimerRunning &&
      matchedIndices.length <
        cards.length
    ) {
      setIsTimerRunning(true);
    }

    const newFlipped = [
      ...flippedIndices,
      index,
    ];

    setFlippedIndices(newFlipped);

    /*
     * Wait until two cards are selected.
     */
    if (newFlipped.length === 2) {
      setMoves(
        (currentMoves) =>
          currentMoves + 1,
      );

      setIsBoardLocked(true);

      const [
        first,
        second,
      ] = newFlipped;

      /*
       * MATCH
       */
      if (
        cards[first] ===
        cards[second]
      ) {
        playMatchSound();

        setMatchedIndices(
          (previous) => [
            ...previous,
            first,
            second,
          ],
        );

        setFlippedIndices([]);

        setIsBoardLocked(false);
      }

      /*
       * MISMATCH
       */
      else {
        playMismatchSound();

        setTimeout(() => {
          setFlippedIndices([]);
          setIsBoardLocked(false);
        }, 600);
      }
    }
  };

  // -----------------------------
  // TIME FORMAT
  // -----------------------------

  const formatTime = (
    totalSeconds: number,
  ) => {
    const mins = Math.floor(
      totalSeconds / 60,
    );

    const secs =
      totalSeconds % 60;

    return `${mins}:${
      secs < 10 ? "0" : ""
    }${secs}`;
  };

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerContainer}>

        {/* SOUND */}
        <Pressable
          accessibilityLabel={
            soundEnabled
              ? "Turn sound off"
              : "Turn sound on"
          }
          style={({ pressed }) => [
            styles.soundButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() =>
            setLocalSoundEnabled(
              (enabled) =>
                !enabled,
            )
          }
        >
          <Ionicons
            name={
              soundEnabled
                ? "volume-high"
                : "volume-mute"
            }
            size={18}
            color="#FAFAFA"
          />
        </Pressable>

        {/* MOVES */}
        <View style={styles.statChip}>
          <Text
            style={styles.statLabel}
          >
            MOVES
          </Text>

          <Text
            style={styles.statValue}
          >
            {displayedMoves}
          </Text>
        </View>

        {/* RESET */}
        <Pressable
          style={({ pressed }) => [
            styles.resetBtn,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={
            onReset ?? resetGame
          }
        >
          <Text
            style={styles.resetIcon}
          >
            🔄
          </Text>

          <Text
            style={styles.resetText}
          >
            RESET
          </Text>
        </Pressable>

        {/* TIME */}
        <View style={styles.statChip}>
          <Text
            style={styles.statLabel}
          >
            TIME
          </Text>

          <Text
            style={styles.statValue}
          >
            {formatTime(seconds)}
          </Text>
        </View>

      </View>

      {/* CARD GRID */}
      <View
        style={[
          styles.grid,
          { gap: GAP },
        ]}
      >
        {displayedCards.map(
          (item, index) => {
            const isFlipped =
              displayedFlippedIndices.includes(
                index,
              ) ||
              displayedMatchedIndices.includes(
                index,
              );

            return (
              <Card
                key={`card-${index}`}
                value={item}
                isFlipped={
                  isFlipped
                }
                onPress={() =>
                  handleCardPress(
                    index,
                  )
                }
                width={
                  cardWidth
                }
                height={
                  cardHeight
                }
              />
            );
          },
        )}
      </View>

    </View>
  );
};

export default Board;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING,
    backgroundColor: "#0F0F12",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#18181C",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2A2A30",
    marginBottom: 20,
  },

  statChip: {
    alignItems: "center",
    minWidth: 65,
  },

  statLabel: {
    color: "#71717A",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  statValue: {
    color: "#FAFAFA",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#27272A",
    borderColor: "#3F3F46",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
  },

  buttonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  resetIcon: {
    fontSize: 12,
  },

  resetText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  soundButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272A",
    borderColor: "#3F3F46",
    borderWidth: 1,
    borderRadius: 6,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 400,
  },
});