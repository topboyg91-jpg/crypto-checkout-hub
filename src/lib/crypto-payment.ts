export type CoinId = "BTC" | "ETH" | "USDT" | "LTC" | "SOL";

export type Coin = {
  id: CoinId;
  name: string;
  network: string;
  /** USD value of 1 unit, used to quote the invoice amount. */
  rate: number;
  decimals: number;
  address: string;
  confirmations: number;
};

export const COINS: Coin[] = [
  {
    id: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    rate: 64850,
    decimals: 8,
    address: "bc1qgiftshop0demo9address4x7k2n8v3qp5m2ljd",
    confirmations: 2,
  },
  {
    id: "ETH",
    name: "Ethereum",
    network: "ERC-20",
    rate: 3120,
    decimals: 6,
    address: "0x9Fa3GiftShopDemo00Address4b71C2e8Ad55E901",
    confirmations: 12,
  },
  {
    id: "USDT",
    name: "Tether",
    network: "TRC-20",
    rate: 1,
    decimals: 2,
    address: "TGiftShopDemoAddr7Yx4Kq2Vn8Pd3Ls9Mb1Rt",
    confirmations: 20,
  },
  {
    id: "LTC",
    name: "Litecoin",
    network: "Litecoin",
    rate: 82.4,
    decimals: 6,
    address: "ltc1qgiftshop0demo7addr3k9x2vn5qp8m4hs2ta",
    confirmations: 6,
  },
  {
    id: "SOL",
    name: "Solana",
    network: "Solana",
    rate: 146.2,
    decimals: 5,
    address: "GiftShopDemo9SoLaNaAddr4Kx7Vn2Qp5Md8Ts3Rb1",
    confirmations: 32,
  },
];

export function getCoin(id: CoinId): Coin {
  return COINS.find((c) => c.id === id) ?? COINS[0];
}

/** Quote a USD total in the chosen coin. */
export function quote(usdTotal: number, id: CoinId): string {
  const coin = getCoin(id);
  return (usdTotal / coin.rate).toFixed(coin.decimals);
}

export function formatRate(id: CoinId): string {
  const coin = getCoin(id);
  return `1 ${coin.id} ≈ $${coin.rate.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** Deterministic-looking mock transaction hash for the demo settlement. */
export function mockTxHash(id: CoinId): string {
  const alphabet = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < 40; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return id === "ETH" || id === "USDT" ? `0x${out}` : out;
}

export const INVOICE_WINDOW_SECONDS = 15 * 60;
