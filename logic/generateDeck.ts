function generateDeck(totalCards: number) {
  const EMOJI_POOL = [
    "🛝",
    "🐍",
    "💣",
    "🐄",
    "🦚",
    "🦢",
    "🎈",
    "💎",
    "🫅🏼",
    "🎃",
    "🐶",
    "🐱",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐸",
    "🐵",
  ];

  // Get enough emojis to form pairs (e.g. 6 total cards need 3 unique emojis)
  const pairCount = Math.floor(totalCards);
  const selectedEmojis = EMOJI_POOL.slice(0, pairCount);

  const deck: string[] = [];
  selectedEmojis.forEach((emoji) => {
    deck.push(emoji);
    deck.push(emoji);
  });

  return deck.sort(() => Math.random() - 0.5);
}
export default generateDeck;
