import generateDeck from '@/logic/generateDeck';
import {
    playMatchSound,
    playMismatchSound,
    playStartSound,
    playWinSound,
    setSoundEnabled,
} from '@/utils/audio';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import Card from './Card';
import type { GameState } from '@/logic/useWebRTC';
import { Ionicons } from '@expo/vector-icons';

// 10 pairs = 20 cards total 🃏
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

const Board = ({ gameState, onCardPress, onReset, canPress = true, pairCount = DEFAULT_PAIRS }: BoardProps) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // 🃏 Deck & Match State
  const [cards, setCards] = useState<string[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [isBoardLocked, setIsBoardLocked] = useState<boolean>(false);

  // 📊 Stats State
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setLocalSoundEnabled] = useState(true);
  const isControlled = gameState !== undefined;
  const displayedCards = gameState?.deck ?? cards;
  const displayedFlippedIndices = gameState?.flippedIndices ?? flippedIndices;
  const displayedMatchedIndices = gameState?.matchedIndices ?? matchedIndices;
  const displayedMoves = gameState?.moves ?? moves;

  // 📐 Dynamic Sizing Calculations for 20 Cards (4 cols x 5 rows)
  const columns = displayedCards.length > 30 ? 6 : displayedCards.length > 20 ? 5 : 4;
  const rows = Math.ceil(displayedCards.length / columns);
  const availableWidth = Math.min(screenWidth, 420) - PADDING * 2;
  const cardWidth = Math.floor((availableWidth - GAP * (columns - 1)) / columns);
  // Maintain a sleek 3:4 aspect ratio
  const availableGridHeight = Math.max(160, screenHeight - 220);
  const cardHeight = Math.max(
    44,
    Math.min(
      Math.floor(cardWidth * 1.2),
      Math.floor((availableGridHeight - GAP * (rows - 1)) / rows),
    ),
  );

  // 🔄 Initialize Game
  useEffect(() => {
    if (!isControlled) {
      setCards(generateDeck(pairCount));
      playStartSound();
    }
  }, [isControlled, pairCount]);

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // ⏱️ Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // 🎉 Win Check & Sound Trigger
  useEffect(() => {
    if (!isControlled && cards.length > 0 && matchedIndices.length === cards.length) {
      setIsTimerRunning(false);
      playWinSound();
    }
  }, [matchedIndices, cards, isControlled]);

  const resetGame = () => {
    const data = generateDeck(pairCount);
    setCards(data);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setMoves(0);
    setSeconds(0);
    setIsTimerRunning(false);
    setIsBoardLocked(false);

    playStartSound();
  };

  const handleCardPress = (index: number) => {
    if (isControlled) {
      if (canPress) onCardPress?.(index);
      return;
    }

    if (
      isBoardLocked ||
      flippedIndices.includes(index) ||
      matchedIndices.includes(index)
    ) {
      return;
    }

    if (!isTimerRunning && matchedIndices.length < cards.length) {
      setIsTimerRunning(true);
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsBoardLocked(true);

      const [first, second] = newFlipped;

      if (cards[first] === cards[second]) {
        playMatchSound();
        setMatchedIndices((prev) => [...prev, first, second]);
        setFlippedIndices([]);
        setIsBoardLocked(false);
      } else {
        playMismatchSound();
        setTimeout(() => {
          setFlippedIndices([]);
          setIsBoardLocked(false);
        }, 600);
      }
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
        
      {/* 📊 Integrated Modern Header */}
      <View style={styles.headerContainer}>
        <Pressable
          accessibilityLabel={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
          style={({ pressed }) => [styles.soundButton, pressed && styles.buttonPressed]}
          onPress={() => setLocalSoundEnabled((enabled) => !enabled)}
        >
          <Ionicons
            name={soundEnabled ? 'volume-high' : 'volume-mute'}
            size={18}
            color="#FAFAFA"
          />
        </Pressable>

        <View style={styles.statChip}>
          <Text style={styles.statLabel}>MOVES</Text>
          <Text style={styles.statValue}>{displayedMoves}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.resetBtn,
            pressed && styles.buttonPressed,
          ]}
          onPress={onReset ?? resetGame}
        >
          <Text style={styles.resetIcon}>🔄</Text>
          <Text style={styles.resetText}>RESET</Text>
        </Pressable>

        <View style={styles.statChip}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={styles.statValue}>{formatTime(seconds)}</Text>
        </View>
      </View>

      {/* 🃏 20-Card Grid */}
      <View style={[styles.grid, { gap: GAP }]}>
        {displayedCards.map((item, index) => {
          const isFlipped =
            displayedFlippedIndices.includes(index) || displayedMatchedIndices.includes(index);

          return (
            <Card
              key={`card-${index}`}
              value={item}
              isFlipped={isFlipped}
              onPress={() => handleCardPress(index)}
              width={cardWidth}
              height={cardHeight}
            />
          );
        })}
      </View>
    </View>
  );
};

export default Board;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING,
    backgroundColor: '#0F0F12',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#18181C',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A2A30',
    marginBottom: 20,
  },
  statChip: {
    alignItems: 'center',
    minWidth: 65,
  },
  statLabel: {
    color: '#71717A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statValue: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27272A',
    borderColor: '#3F3F46',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  resetIcon: {
    fontSize: 12,
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  soundButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
    borderColor: '#3F3F46',
    borderWidth: 1,
    borderRadius: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 400,
  },
});
