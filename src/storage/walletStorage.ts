import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletCard } from '../types/card';

const STORAGE_KEY = '@card_wallet/cards_v1';

export async function loadCards(): Promise<WalletCard[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WalletCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCards(cards: WalletCard[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export async function addCard(card: WalletCard): Promise<WalletCard[]> {
  const cards = await loadCards();
  const next = [card, ...cards];
  await saveCards(next);
  return next;
}

export async function updateCard(
  id: string,
  patch: Partial<WalletCard>
): Promise<WalletCard[]> {
  const cards = await loadCards();
  const next = cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
  await saveCards(next);
  return next;
}

export async function deleteCard(id: string): Promise<WalletCard[]> {
  const cards = await loadCards();
  const next = cards.filter((c) => c.id !== id);
  await saveCards(next);
  return next;
}

export async function getCardById(id: string): Promise<WalletCard | null> {
  const cards = await loadCards();
  return cards.find((c) => c.id === id) ?? null;
}

export function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
