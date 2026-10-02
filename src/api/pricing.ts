import { CardSearchResult, GameType, WalletCard } from '../types/card';
import { getPokemonCardById, searchPokemonCards } from './pokemon';
import { getMtgCardById, searchMtgCards } from './scryfall';

export async function searchCards(
  game: GameType,
  query: string
): Promise<CardSearchResult[]> {
  if (game === 'pokemon') {
    return searchPokemonCards(query);
  }
  return searchMtgCards(query);
}

export async function refreshCardPrice(
  card: WalletCard
): Promise<Partial<WalletCard>> {
  if (!card.apiId) {
    return {};
  }

  const result =
    card.game === 'pokemon'
      ? await getPokemonCardById(card.apiId)
      : await getMtgCardById(card.apiId);

  if (!result) {
    return { lastUpdated: new Date().toISOString() };
  }

  return {
    price: result.price,
    currency: result.currency,
    priceTcgPlayer: result.priceTcgPlayer ?? null,
    priceCardmarket: result.priceCardmarket ?? null,
    catalogImageUrl: result.catalogImageUrl ?? card.catalogImageUrl,
    set: result.set || card.set,
    lastUpdated: new Date().toISOString(),
  };
}

export async function refreshAllPrices(
  cards: WalletCard[],
  onProgress?: (done: number, total: number) => void
): Promise<WalletCard[]> {
  const updated: WalletCard[] = [];
  let done = 0;

  for (const card of cards) {
    try {
      // Be polite to Scryfall (~10 req/s) and Pokémon API
      if (done > 0) {
        await delay(120);
      }
      const patch = await refreshCardPrice(card);
      updated.push({ ...card, ...patch });
    } catch {
      updated.push(card);
    }
    done += 1;
    onProgress?.(done, cards.length);
  }

  return updated;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatPrice(
  price: number | null | undefined,
  currency: string = 'USD'
): string {
  if (price == null || Number.isNaN(price)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

/** Sum wallet value converting EUR→USD at a fixed rate for display totals */
const EUR_TO_USD = 1.08;

export function walletTotalUsd(cards: WalletCard[]): number {
  return cards.reduce((sum, c) => {
    if (c.price == null) return sum;
    if (c.currency === 'EUR') return sum + c.price * EUR_TO_USD;
    return sum + c.price;
  }, 0);
}
