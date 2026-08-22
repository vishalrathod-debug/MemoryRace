import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

type CardProp = {
  value: string;
  isFlipped: boolean;
  onPress: () => void;
  width: number;
  height: number;
};

const Card = ({ value, isFlipped, onPress, width, height }: CardProp) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isFlipped ? 180 : 0, { duration: 300 });
  }, [isFlipped, rotation]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const frontStyle = useAnimatedStyle(() => {
    const spin = interpolate(rotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${spin}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  // Scale icon size relative to card width 🔤
  const fontSize = Math.floor(width * 0.42);

  return (
    <Pressable onPress={onPress} style={{ width, height }}>
      {/* Back Side */}
      <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
        <Text style={[styles.icon, { fontSize }]}>🧠</Text>
      </Animated.View>

      {/* Front Side */}
      <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
        <Text style={[styles.icon, { fontSize }]}>{value}</Text>
      </Animated.View>
    </Pressable>
  );
};

export default Card;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardBack: {
    backgroundColor: '#1E1E24',
    borderColor: '#2E2E38',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E4E7',
  },
  icon: {
    textAlign: 'center',
  },
});
