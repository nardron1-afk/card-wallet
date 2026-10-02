import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatPrice } from '../api/pricing';

interface Props {
  totalUsd: number;
  cardCount: number;
  refreshing?: boolean;
}

export function WalletHeader({ totalUsd, cardCount, refreshing }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Wallet Value</Text>
      <Text style={styles.total}>{formatPrice(totalUsd, 'USD')}</Text>
      <Text style={styles.meta}>
        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        {refreshing ? ' · Updating prices…' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  total: {
    color: colors.success,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
});
