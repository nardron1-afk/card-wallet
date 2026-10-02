import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { formatPrice } from '../api/pricing';
import { Currency } from '../types/card';

interface Props {
  price: number | null;
  currency?: Currency;
  size?: 'sm' | 'lg';
}

export function PriceBadge({ price, currency = 'USD', size = 'sm' }: Props) {
  const isMissing = price == null;
  return (
    <View
      style={[
        styles.badge,
        size === 'lg' && styles.badgeLg,
        isMissing && styles.badgeMuted,
      ]}
    >
      <Text style={[styles.text, size === 'lg' && styles.textLg]}>
        {formatPrice(price, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeMuted: {
    backgroundColor: colors.surface,
  },
  text: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  textLg: {
    fontSize: 20,
  },
});
