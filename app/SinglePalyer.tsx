import Board from '@/components/Board';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SinglePalyer = () => {
  const [pairCount, setPairCount] = useState(10);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.selector}>
        <Text style={styles.selectorLabel}>PAIRS</Text>
        <View style={styles.pairOptions}>
          {[4, 6, 8, 10].map((count) => (
            <Pressable
              key={count}
              accessibilityRole="button"
              accessibilityState={{ selected: pairCount === count }}
              onPress={() => setPairCount(count)}
              style={[styles.pairButton, pairCount === count && styles.pairButtonActive]}
            >
              <Text style={[styles.pairText, pairCount === count && styles.pairTextActive]}>{count}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Board pairCount={pairCount} />
    </SafeAreaView>
  );
};

export default SinglePalyer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F12",
  },
  selector: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  selectorLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pairOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  pairButton: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#3F3F46',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#18181C',
  },
  pairButtonActive: {
    backgroundColor: '#50E3C2',
    borderColor: '#50E3C2',
  },
  pairText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '800',
  },
  pairTextActive: {
    color: '#06241E',
  },
});
