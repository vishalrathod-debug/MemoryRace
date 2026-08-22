import React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import Board from "../components/Board";
import { useWebRTC } from "../logic/useWebRTC";

interface MultiplayerWrapperProps {
  serverUrl: string;
  roomCode: string;
  isHost: boolean;
  onLeave?: () => void;
}

export const MultiplayerWrapper: React.FC<
  MultiplayerWrapperProps
> = ({
  serverUrl,
  roomCode,
  isHost,
  onLeave,
}) => {
  const {
    game,
    status,
    error,
    sendCardFlip,
    resetGame,
  } = useWebRTC(
    serverUrl,
    roomCode,
    isHost,
  );

  /*
   * Host = Player 0
   * Guest = Player 1
   */
  const playerIndex: 0 | 1 = isHost ? 0 : 1;

  const opponentIndex: 0 | 1 =
    isHost ? 1 : 0;

  /*
   * Only allow the current player to
   * interact with the board.
   */
  const canPress =
    status === "ready" &&
    game !== null &&
    game.currentTurn === playerIndex &&
    !game.locked;

  /*
   * GAME OVER
   *
   * All cards must be matched.
   */
  const isGameOver =
    game !== null &&
    game.deck.length > 0 &&
    game.matchedIndices.length ===
      game.deck.length;

  /*
   * SCORE
   *
   * IMPORTANT:
   *
   * We do NOT keep a separate score state here.
   *
   * The server sends:
   *
   * scores: [player0Score, player1Score]
   *
   * useWebRTC receives that state and updates
   * `game`.
   *
   * These values therefore update automatically
   * whenever the server broadcasts room_state.
   */
  const myScore =
    game?.scores?.[playerIndex] ?? 0;

  const opponentScore =
    game?.scores?.[opponentIndex] ?? 0;

  /*
   * RESULT
   */
  let resultTitle = "DRAW!";
  let resultEmoji = "🤝";

  if (myScore > opponentScore) {
    resultTitle = "YOU WIN!";
    resultEmoji = "🏆";
  } else if (
    myScore < opponentScore
  ) {
    resultTitle = "YOU LOSE!";
    resultEmoji = "💔";
  }

  /*
   * STATUS MESSAGE
   */
  let message = "Opponent's turn";

  if (error) {
    message = error;
  } else if (status === "connecting") {
    message = "Connecting to room...";
  } else if (status === "waiting") {
    message =
      "Waiting for another player...";
  } else if (isGameOver) {
    message = "Match finished!";
  } else if (
    game?.currentTurn === playerIndex
  ) {
    message = "Your turn";
  }

  return (
    <View style={styles.container}>

      {/* =========================
          ROOM / SCORE BAR
         ========================= */}
      <View style={styles.roomBar}>

        <Text style={styles.roomLabel}>
          ROOM {roomCode}
        </Text>

        <Text style={styles.status}>
          {message}
        </Text>

        {game && (
          <View style={styles.scoreRow}>

            {/* YOUR SCORE */}
            <Text
              style={[
                styles.scoreText,
                game.currentTurn ===
                  playerIndex &&
                  styles.activeTurn,
              ]}
            >
              YOU: {myScore}
            </Text>

            <Text
              style={styles.scoreDivider}
            >
              |
            </Text>

            {/* OPPONENT SCORE */}
            <Text
              style={[
                styles.scoreText,
                game.currentTurn ===
                  opponentIndex &&
                  styles.activeTurn,
              ]}
            >
              OPPONENT: {opponentScore}
            </Text>

          </View>
        )}
      </View>

      {/* =========================
          BOARD
         ========================= */}
      <Board
        gameState={game}
        onCardPress={sendCardFlip}
        onReset={resetGame}
        canPress={Boolean(canPress)}
      />

      {/* =========================
          GAME OVER MODAL
         ========================= */}
      <Modal
        transparent
        animationType="fade"
        visible={isGameOver}
      >
        <View style={styles.overlay}>

          <View style={styles.card}>

            <Text style={styles.emoji}>
              {resultEmoji}
            </Text>

            <Text style={styles.title}>
              {resultTitle}
            </Text>

            <View
              style={
                styles.finalScoreContainer
              }
            >

              <Text
                style={
                  styles.finalScoreText
                }
              >
                Your Score:{" "}
                <Text
                  style={
                    styles.highlight
                  }
                >
                  {myScore}
                </Text>
              </Text>

              <Text
                style={
                  styles.finalScoreText
                }
              >
                Opponent:{" "}
                <Text
                  style={
                    styles.highlight
                  }
                >
                  {opponentScore}
                </Text>
              </Text>

              <Text
                style={styles.movesText}
              >
                Total Moves:{" "}
                {game?.moves ?? 0}
              </Text>

            </View>

            {/* PLAY AGAIN */}
            <Pressable
              style={styles.primaryBtn}
              onPress={resetGame}
            >
              <Text
                style={styles.primaryText}
              >
                PLAY AGAIN
              </Text>
            </Pressable>

            {/* EXIT */}
            {onLeave && (
              <Pressable
                style={
                  styles.secondaryBtn
                }
                onPress={onLeave}
              >
                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  EXIT TO LOBBY
                </Text>
              </Pressable>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F12",
  },

  roomBar: {
    alignItems: "center",
    paddingTop: 10,
    gap: 4,
  },

  roomLabel: {
    color: "#FAFAFA",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },

  status: {
    color: "#A1A1AA",
    fontSize: 13,
  },

  scoreRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
    alignItems: "center",
  },

  scoreText: {
    color: "#71717A",
    fontSize: 14,
    fontWeight: "700",
  },

  activeTurn: {
    color: "#50E3C2",
    fontWeight: "900",
  },

  scoreDivider: {
    color: "#3F3F46",
  },

  overlay: {
    flex: 1,
    backgroundColor:
      "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#18181C",
    borderColor: "#3F3F46",
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },

  emoji: {
    fontSize: 52,
    marginBottom: 8,
  },

  title: {
    color: "#FAFAFA",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 16,
  },

  finalScoreContainer: {
    alignItems: "center",
    gap: 4,
    marginBottom: 24,
  },

  finalScoreText: {
    color: "#D4D4D8",
    fontSize: 16,
    fontWeight: "600",
  },

  highlight: {
    color: "#50E3C2",
    fontWeight: "800",
  },

  movesText: {
    color: "#71717A",
    fontSize: 13,
    marginTop: 6,
  },

  primaryBtn: {
    width: "100%",
    backgroundColor: "#50E3C2",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },

  primaryText: {
    color: "#06241E",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },

  secondaryBtn: {
    width: "100%",
    borderColor: "#52525B",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },

  secondaryText: {
    color: "#FAFAFA",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
});