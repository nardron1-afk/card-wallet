import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { WalletCard } from '../types/card';
import { loadCards, saveCards } from '../storage/walletStorage';
import { refreshAllPrices, walletTotalUsd } from '../api/pricing';
import { WalletHeader } from '../components/WalletHeader';
import { CardListItem } from '../components/CardListItem';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Wallet'>;

export function WalletScreen() {
  const navigation = useNavigation<Nav>();
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const data = await loadCards();
    setCards(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const onRefreshPrices = useCallback(async () => {
    setRefreshing(true);
    try {
      const current = await loadCards();
      const updated = await refreshAllPrices(current);
      await saveCards(updated);
      setCards(updated);
    } catch {
      // keep existing cards
    } finally {
      setRefreshing(false);
    }
  }, []);

  const total = walletTotalUsd(cards);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <Text style={styles.title}>Card Wallet</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddCard')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <WalletHeader
        totalUsd={total}
        cardCount={cards.length}
        refreshing={refreshing}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CardListItem
              card={item}
              onPress={() =>
                navigation.navigate('CardDetail', { cardId: item.id })
              }
            />
          )}
          contentContainerStyle={
            cards.length === 0 ? styles.emptyContainer : styles.listPad
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🃏</Text>
              <Text style={styles.emptyTitle}>Your wallet is empty</Text>
              <Text style={styles.emptyBody}>
                Add Pokémon or Magic cards with a photo and live market prices.
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddCard')}
              >
                <Text style={styles.emptyBtnText}>Add your first card</Text>
              </Pressable>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshPrices}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  listPad: {
    paddingBottom: 32,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  empty: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
});
