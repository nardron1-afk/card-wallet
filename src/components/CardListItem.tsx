import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { colors } from '../theme/colors';
import { WalletCard } from '../types/card';
import { PriceBadge } from './PriceBadge';

interface Props {
  card: WalletCard;
  onPress: () => void;
}

export function CardListItem({ card, onPress }: Props) {
  const thumb = card.imageUri || card.catalogImageUrl;

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.thumbWrap}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={styles.placeholderText}>🃏</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.set} numberOfLines={1}>
          {card.set || 'Unknown set'}
        </Text>
        <View style={styles.gameTag}>
          <Text
            style={[
              styles.gameText,
              card.game === 'pokemon' ? styles.pokemon : styles.mtg,
            ]}
          >
            {card.game === 'pokemon' ? 'Pokémon' : 'MTG'}
          </Text>
        </View>
      </View>
      <PriceBadge price={card.price} currency={card.currency} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  thumbWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumb: {
    width: 52,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  set: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  gameTag: {
    marginTop: 6,
  },
  gameText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pokemon: {
    color: colors.pokemon,
  },
  mtg: {
    color: colors.mtg,
  },
});
