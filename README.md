# Card Wallet

Phone-first digital wallet for Pokémon TCG and Magic: The Gathering cards.

Take or pick photos of your cards, match them to live market data, and track your wallet total.

## Run

```bash
npm install
npx expo start
```

Scan with [Expo Go](https://expo.dev/go) on your phone (same Wi‑Fi), or `npx expo start --tunnel` if LAN fails.

Optional: copy `.env.example` → `.env` and set `EXPO_PUBLIC_POKEMON_TCG_API_KEY` from https://dev.pokemontcg.io

## Stack

- Expo SDK 57 + TypeScript
- Pokémon prices: [pokemontcg.io](https://pokemontcg.io)
- MTG prices: [Scryfall](https://scryfall.com)
