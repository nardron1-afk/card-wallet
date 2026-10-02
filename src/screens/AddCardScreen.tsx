import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { GameSelector } from '../components/GameSelector';
import {
  CardSearchResult,
  GameType,
  WalletCard,
} from '../types/card';
import { searchCards, formatPrice } from '../api/pricing';
import { addCard, generateId } from '../storage/walletStorage';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddCard'>;

export function AddCardScreen() {
  const navigation = useNavigation<Nav>();

  const [game, setGame] = useState<GameType>('pokemon');
  const [query, setQuery] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualSet, setManualSet] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardSearchResult | null>(null);
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    if (fromCamera) {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) {
        Alert.alert(
          'Camera permission needed',
          'Allow camera access to photograph your cards.'
        );
        return;
      }
    } else {
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!lib.granted) {
        Alert.alert(
          'Photo library permission needed',
          'Allow photo access to pick card images.'
        );
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [5, 7],
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [5, 7],
          mediaTypes: ['images'],
        });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSelected(null);
    try {
      const data = await searchCards(game, q);
      setResults(data);
      if (data.length === 0) {
        Alert.alert(
          'No matches',
          'Try a different name, or enter the card manually below.'
        );
      }
    } catch (e) {
      Alert.alert(
        'Search failed',
        e instanceof Error ? e.message : 'Network error talking to pricing API.'
      );
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [game, query]);

  const onSelectResult = (item: CardSearchResult) => {
    setSelected(item);
    setManualName(item.name);
    setManualSet(item.set);
  };

  const onSave = async () => {
    const name = (selected?.name || manualName).trim();
    if (!name) {
      Alert.alert('Name required', 'Search for a card or type a name.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const card: WalletCard = {
        id: generateId(),
        game,
        name,
        set: selected?.set || manualSet.trim() || 'Unknown Set',
        imageUri,
        catalogImageUrl: selected?.catalogImageUrl ?? null,
        apiId: selected?.apiId ?? null,
        price: selected?.price ?? null,
        currency: selected?.currency ?? 'USD',
        priceTcgPlayer: selected?.priceTcgPlayer ?? null,
        priceCardmarket: selected?.priceCardmarket ?? null,
        lastUpdated: selected ? now : null,
        createdAt: now,
      };
      await addCard(card);
      navigation.goBack();
    } catch {
      Alert.alert('Save failed', 'Could not save the card locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={results}
          keyExtractor={(item) => item.apiId}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.sectionLabel}>Game</Text>
              <GameSelector
                value={game}
                onChange={(g) => {
                  setGame(g);
                  setResults([]);
                  setSelected(null);
                }}
              />

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                Card photo
              </Text>
              <View style={styles.photoRow}>
                <View style={styles.photoPreview}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.photo} />
                  ) : (
                    <Text style={styles.photoPlaceholder}>No photo</Text>
                  )}
                </View>
                <View style={styles.photoActions}>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => pickImage(true)}
                  >
                    <Text style={styles.secondaryBtnText}>📷 Camera</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => pickImage(false)}
                  >
                    <Text style={styles.secondaryBtnText}>🖼️ Library</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                Search catalog
              </Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.input}
                  placeholder={
                    game === 'pokemon'
                      ? 'e.g. Charizard, Pikachu…'
                      : 'e.g. Black Lotus, Lightning Bolt…'
                  }
                  placeholderTextColor={colors.textMuted}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={onSearch}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                <Pressable style={styles.searchBtn} onPress={onSearch}>
                  {searching ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.searchBtnText}>Search</Text>
                  )}
                </Pressable>
              </View>

              {selected && (
                <View style={styles.selectedBanner}>
                  <Text style={styles.selectedText}>
                    Selected: {selected.name} ·{' '}
                    {formatPrice(selected.price, selected.currency)}
                  </Text>
                </View>
              )}

              {results.length > 0 && (
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                  Results ({results.length})
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.resultRow,
                selected?.apiId === item.apiId && styles.resultSelected,
              ]}
              onPress={() => onSelectResult(item)}
            >
              {item.catalogImageUrl ? (
                <Image
                  source={{ uri: item.catalogImageUrl }}
                  style={styles.resultThumb}
                />
              ) : (
                <View style={[styles.resultThumb, styles.resultThumbEmpty]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.resultSet} numberOfLines={1}>
                  {item.set}
                </Text>
              </View>
              <Text style={styles.resultPrice}>
                {formatPrice(item.price, item.currency)}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.sectionLabel}>Or enter manually</Text>
              <TextInput
                style={styles.inputFull}
                placeholder="Card name"
                placeholderTextColor={colors.textMuted}
                value={manualName}
                onChangeText={(t) => {
                  setManualName(t);
                  setSelected(null);
                }}
              />
              <TextInput
                style={[styles.inputFull, { marginTop: 8 }]}
                placeholder="Set (optional)"
                placeholderTextColor={colors.textMuted}
                value={manualSet}
                onChangeText={setManualSet}
              />

              <Pressable
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={onSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Add to wallet</Text>
                )}
              </Pressable>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  photoPreview: {
    width: 90,
    height: 126,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    color: colors.textMuted,
    fontSize: 12,
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  inputFull: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  searchBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
  selectedBanner: {
    marginTop: 12,
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    padding: 10,
  },
  selectedText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 13,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  resultSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  resultThumb: {
    width: 40,
    height: 56,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  resultThumbEmpty: {},
  resultName: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  resultSet: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  resultPrice: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 16,
  },
});
