import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { WalletCard } from '../types/card';
import {
  deleteCard,
  getCardById,
  updateCard,
} from '../storage/walletStorage';
import { formatPrice, refreshCardPrice } from '../api/pricing';
import { PriceBadge } from '../components/PriceBadge';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CardDetail'>;
type Route = RouteProp<RootStackParamList, 'CardDetail'>;

export function CardDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { cardId } = route.params;

  const [card, setCard] = useState<WalletCard | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const c = await getCardById(cardId);
    setCard(c);
  }, [cardId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefreshPrice = async () => {
    if (!card) return;
    setRefreshing(true);
    try {
      const patch = await refreshCardPrice(card);
      const next = await updateCard(card.id, patch);
      setCard(next.find((c) => c.id === card.id) ?? { ...card, ...patch });
    } catch {
      Alert.alert('Price refresh failed', 'Could not reach the pricing API.');
    } finally {
      setRefreshing(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Remove card?', 'This removes it from your wallet.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteCard(cardId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!card) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const displayImage = card.imageUri || card.catalogImageUrl;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={{ fontSize: 64 }}>🃏</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{card.name}</Text>
        <Text style={styles.set}>{card.set || 'Unknown set'}</Text>
        <Text
          style={[
            styles.game,
            card.game === 'pokemon' ? styles.pokemon : styles.mtg,
          ]}
        >
          {card.game === 'pokemon' ? 'Pokémon TCG' : 'Magic: The Gathering'}
        </Text>

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Market price</Text>
          <PriceBadge price={card.price} currency={card.currency} size="lg" />
          {card.lastUpdated && (
            <Text style={styles.updated}>
              Updated {new Date(card.lastUpdated).toLocaleString()}
            </Text>
          )}
        </View>

        {(card.priceTcgPlayer != null || card.priceCardmarket != null) && (
          <View style={styles.extraPrices}>
            <Text style={styles.extraTitle}>Price sources</Text>
            <View style={styles.extraRow}>
              <Text style={styles.extraLabel}>TCGPlayer</Text>
              <Text style={styles.extraValue}>
                {formatPrice(card.priceTcgPlayer ?? null, 'USD')}
              </Text>
            </View>
            <View style={styles.extraRow}>
              <Text style={styles.extraLabel}>Cardmarket</Text>
              <Text style={styles.extraValue}>
                {formatPrice(card.priceCardmarket ?? null, 'EUR')}
              </Text>
            </View>
            <Text style={styles.stubNote}>
              Placeholders ready for direct TCGPlayer / Cardmarket API keys
              later. Currently sourced via Pokémon TCG API / Scryfall.
            </Text>
          </View>
        )}

        <Pressable
          style={styles.refreshBtn}
          onPress={onRefreshPrice}
          disabled={refreshing || !card.apiId}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.refreshBtnText}>
              {card.apiId ? 'Refresh price' : 'No API link — price locked'}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>Remove from wallet</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  imageWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 220,
    height: 308,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  set: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
  },
  game: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 20,
  },
  pokemon: { color: colors.pokemon },
  mtg: { color: colors.mtg },
  priceBlock: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  updated: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  extraPrices: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  extraTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 10,
  },
  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  extraLabel: {
    color: colors.textSecondary,
  },
  extraValue: {
    color: colors.text,
    fontWeight: '600',
  },
  stubNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 10,
    lineHeight: 16,
  },
  refreshBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
