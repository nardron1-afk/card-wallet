import { CardSearchResult } from '../types/card';

/**
 * Scryfall API (https://scryfall.com/docs/api)
 * Legal, free, no API key. Rate limit: ~10 req/sec — be polite.
 * Prices: prices.usd / prices.eur (TCGPlayer / Cardmarket feeds).
 */

const BASE = 'https://api.scryfall.com';

interface ScryfallCard {
  id: string;
  name: string;
  set_name?: string;
  set?: string;
  image_uris?: { small?: string; normal?: string; large?: string };
  card_faces?: Array<{ image_uris?: { small?: string; normal?: string } }>;
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
    eur?: string | null;
    eur_foil?: string | null;
  };
}

function catalogImage(card: ScryfallCard): string | null {
  return (
    card.image_uris?.normal ??
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.small ??
    null
  );
}

function toSearchResult(card: ScryfallCard): CardSearchResult {
  const usd = card.prices?.usd ? parseFloat(card.prices.usd) : null;
  const eur = card.prices?.eur ? parseFloat(card.prices.eur) : null;
  const usdFoil = card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null;

  const priceUsd = usd != null && !Number.isNaN(usd) ? usd : usdFoil;
  const priceEur = eur != null && !Number.isNaN(eur) ? eur : null;

  // Prefer USD; fall back to EUR
  const price =
    priceUsd != null && !Number.isNaN(priceUsd)
      ? priceUsd
      : priceEur != null && !Number.isNaN(priceEur)
        ? priceEur
        : null;
  const currency = priceUsd != null ? 'USD' : priceEur != null ? 'EUR' : 'USD';

  return {
    apiId: card.id,
    name: card.name,
    set: card.set_name ?? card.set ?? 'Unknown Set',
    setCode: card.set,
    catalogImageUrl: catalogImage(card),
    price,
    currency,
    priceTcgPlayer: priceUsd,
    priceCardmarket: priceEur,
    game: 'mtg',
  };
}

export async function searchMtgCards(
  query: string,
  pageSize = 20
): Promise<CardSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const url = `${BASE}/cards/search?q=${encodeURIComponent(q)}&unique=prints&order=released&dir=desc`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    // No cards matched
    return [];
  }
  if (!res.ok) {
    throw new Error(`Scryfall API error: ${res.status}`);
  }

  const data = (await res.json()) as { data?: ScryfallCard[] };
  return (data.data ?? []).slice(0, pageSize).map(toSearchResult);
}

export async function getMtgCardById(
  apiId: string
): Promise<CardSearchResult | null> {
  const res = await fetch(`${BASE}/cards/${encodeURIComponent(apiId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const card = (await res.json()) as ScryfallCard;
  return toSearchResult(card);
}
