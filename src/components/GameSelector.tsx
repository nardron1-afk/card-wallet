import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { GameType } from '../types/card';

interface Props {
  value: GameType;
  onChange: (game: GameType) => void;
}

export function GameSelector({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange('pokemon')}
        style={[
          styles.chip,
          value === 'pokemon' && styles.chipPokemonActive,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            value === 'pokemon' && styles.chipTextActive,
          ]}
        >
          Pokémon TCG
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('mtg')}
        style={[styles.chip, value === 'mtg' && styles.chipMtgActive]}
      >
        <Text
          style={[styles.chipText, value === 'mtg' && styles.chipTextActive]}
        >
          Magic: The Gathering
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipPokemonActive: {
    backgroundColor: colors.pokemonDark,
    borderColor: colors.pokemon,
  },
  chipMtgActive: {
    backgroundColor: colors.mtgDark,
    borderColor: colors.mtg,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  chipTextActive: {
    color: colors.white,
  },
});
