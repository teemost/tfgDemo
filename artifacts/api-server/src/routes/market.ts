import { Router } from "express";

const router = Router();

// Static market tickers with realistic seed data
const TICKERS = [
  { symbol: "XAU/USD", name: "Gold", price: 2341.50, change24h: 12.30, changePercent24h: 0.53, type: "gold", iconUrl: null },
  { symbol: "BTC/USD", name: "Bitcoin", price: 67842.10, change24h: -1253.40, changePercent24h: -1.82, type: "crypto", iconUrl: null },
  { symbol: "ETH/USD", name: "Ethereum", price: 3521.80, change24h: 45.20, changePercent24h: 1.30, type: "crypto", iconUrl: null },
  { symbol: "USDT/USD", name: "Tether", price: 1.00, change24h: 0.00, changePercent24h: 0.01, type: "crypto", iconUrl: null },
  { symbol: "EUR/USD", name: "Euro", price: 1.0842, change24h: -0.0023, changePercent24h: -0.21, type: "forex", iconUrl: null },
  { symbol: "GBP/USD", name: "British Pound", price: 1.2718, change24h: 0.0031, changePercent24h: 0.24, type: "forex", iconUrl: null },
  { symbol: "XAG/USD", name: "Silver", price: 27.45, change24h: 0.32, changePercent24h: 1.18, type: "gold", iconUrl: null },
];

router.get("/market/tickers", async (_req, res): Promise<void> => {
  // Add small random fluctuation to simulate live data
  const tickers = TICKERS.map(t => ({
    ...t,
    price: parseFloat((t.price * (1 + (Math.random() - 0.5) * 0.001)).toFixed(t.price > 100 ? 2 : 4)),
  }));
  res.json(tickers);
});

export default router;
