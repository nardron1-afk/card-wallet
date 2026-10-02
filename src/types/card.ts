export type GameType = 'pokemon' | 'mtg';

export type Currency = 'USD' | 'EUR';

export interface WalletCard {
  id: string;
  game: GameType;
  name: string;
  set: string;
  imageUri: string | null;
  /** Official/catalog image URL from API (optional) */
  catalogImageUrl?: string | null;
  /** External API card id for price refresh */
  apiId?: string | null;
  price: number | null;
  currency: Currency;
  lastUpdated: string | null;
  /** Market placeholders for future TCGPlayer / Cardmarket integration */
  priceTcgPlayer?: number | null;
  priceCardmarket?: number | null;
  createdAt: string;
}

export interface CardSearchResult {
  apiId: string;
  name: string;
  set: string;
  setCode?: string;
  catalogImageUrl?: string | null;
  price: number | null;
  currency: Currency;
  /** Pokémon-specific tcgplayer / cardmarket stubs when present */
  priceTcgPlayer?: number | null;
  priceCardmarket?: number | null;
  game: GameType;
}
