import React, { memo, useMemo } from 'react';
import { Text, View, ViewStyle } from 'react-native';

interface DishRatingProps {
  rating: number; // 0 - 10
  size?: number; // emoji font size
  style?: ViewStyle;
}

// Renders 10 dish emojis with opacity to reflect rating + numeric label
function DishRatingComponent({ rating, size = 24, style }: DishRatingProps) {
  const { emojis, ratingColor, isPerfect } = useMemo(() => {
    const whole = Math.floor(rating);
    const halfIndex = Math.ceil(rating) - 1;
    const arr = Array.from({ length: 10 }).map((_, i) => {
      const filled = i < whole;
      const opacity = filled ? 1 : i === halfIndex ? 0.65 : 0.15;
      return { i, opacity };
    });
    const r = rating;
    const ratingColor = r === 10
      ? '#9C27B0'
      : r >= 7.5
        ? '#2E7D32'
        : r >= 5
          ? '#fbef1bff'
          : r >= 2.5
            ? '#FB8C00'
            : '#D32F2F';
    return { emojis: arr, ratingColor, isPerfect: r === 10 };
  }, [rating]);

  return (
    <View>
      <Text
        style={{
          alignSelf: 'center',
          fontSize: 14,
          fontWeight: '600',
          color: ratingColor,
          ...(isPerfect && {
            textShadowColor: '#CE93D8',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
          }),
        }}
      >
        {rating.toFixed(1)}/10.0
      </Text>
      <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, isPerfect && { shadowColor: '#9C27B0', shadowOpacity: 0.95, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 12 }, style]}>
        {emojis.map(({ i, opacity }) => (
          <Text
            key={i}
            style={{
              fontSize: size,
              marginHorizontal: 2,
              opacity,
              ...(isPerfect && {
                textShadowColor: '#E1BEE7',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }),
            }}
          >
            🍽️
          </Text>
        ))}
      </View>
    </View>
  );
}

const DishRating = memo(DishRatingComponent);
export default DishRating;
