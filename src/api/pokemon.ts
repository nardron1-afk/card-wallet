import { CardSearchResult } from '../types/card';

/**
 * Pokémon TCG API (https://pokemontcg.io)
 * Public & free. Optional API key via EXPO_PUBLIC_POKEMON_TCG_API_KEY
 * raises rate limits (dev without key: shared public quota).
 *
 * Prices: the API surfaces tcgplayer / cardmarket market data when available.
 * Structure keeps placeholders ready if those fields are missing.
 */

const BASE = 'https://api.pokemontcg.io/v2';

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/json',
  };
  const key = process.env.EXPO_PUBLIC_POKEMON_TCG_API_KEY;
  if (key) {
    h['X-Api-Key'] = key;
  }
  return h;
}

interface PokemonTcgCard {
  id: string;
  name: string;
  set?: { name?: string; id?: string };
  images?: { small?: string; large?: string };
  tcgplayer?: {
    prices?: {
      normal?: { market?: number; mid?: number };
      holofoil?: { market?: number; mid?: number };
      reverseHolofoil?: { market?: number; mid?: number };
      '1stEditionHolofoil'?: { market?: number; mid?: number };
    };
  };
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
      trendPrice?: number;
      lowPrice?: number;
    };
  };
}

function extractTcgPlayerPrice(card: PokemonTcgCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;
  const variants = [
    prices.holofoil,
    prices.normal,
    prices.reverseHolofoil,
    prices['1stEditionHolofoil'],
  ];
  for (const v of variants) {
    if (v?.market != null && v.market > 0) return v.market;
    if (v?.mid != null && v.mid > 0) return v.mid;
  }
  return null;
}

function extractCardmarketPrice(card: PokemonTcgCard): number | null {
  const p = card.cardmarket?.prices;
  if (!p) return null;
  if (p.averageSellPrice != null && p.averageSellPrice > 0) return p.averageSellPrice;
  if (p.trendPrice != null && p.trendPrice > 0) return p.trendPrice;
  if (p.lowPrice != null && p.lowPrice > 0) return p.lowPrice;
  return null;
}

function toSearchResult(card: PokemonTcgCard): CardSearchResult {
  const tcg = extractTcgPlayerPrice(card);
  const cm = extractCardmarketPrice(card);
  const price = tcg ?? cm;
  const currency = tcg != null ? 'USD' : cm != null ? 'EUR' : 'USD';

  return {
    apiId: card.id,
    name: card.name,
    set: card.set?.name ?? 'Unknown Set',
    setCode: card.set?.id,
    catalogImageUrl: card.images?.small ?? card.images?.large ?? null,
    price,
    currency,
    priceTcgPlayer: tcg,
    priceCardmarket: cm,
    game: 'pokemon',
  };
}

export async function searchPokemonCards(
  query: string,
  pageSize = 20
): Promise<CardSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  // Lucene-style prefix search: name:charizard*
  const lucene = `name:${q}*`;
  const url = `${BASE}/cards?q=${encodeURIComponent(lucene)}&pageSize=${pageSize}&orderBy=-set.releaseDate`;

  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Pokémon TCG API error: ${res.status}`);
  }

  const data = (await res.json()) as { data?: PokemonTcgCard[] };
  return (data.data ?? []).map(toSearchResult);
}

export async function getPokemonCardById(
  apiId: string
): Promise<CardSearchResult | null> {
  const res = await fetch(`${BASE}/cards/${encodeURIComponent(apiId)}`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: PokemonTcgCard };
  if (!data.data) return null;
  return toSearchResult(data.data);
}
