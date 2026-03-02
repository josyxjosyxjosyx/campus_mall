import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Currency = "USD" | "GBP" | "SLE";

interface ExchangeRates {
  USD: number;
  GBP: number;
  SLE: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates;
  convertPrice: (priceInUSD: number, targetCurrency?: Currency) => number;
  formatPrice: (priceInUSD: number, targetCurrency?: Currency) => string;
  getCurrencySymbol: (currency?: Currency) => string;
}

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
  SLE: "SLE"
};

const defaultExchangeRates: ExchangeRates = {
  USD: 1,
  GBP: 0.79,
  SLE: 22
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem("currency");
    return (stored as Currency) || "USD";
  });

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultExchangeRates);

  // Fetch latest exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Using exchangerate-api.com free tier (no API key needed for basic usage)
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await response.json();
        
        if (data.rates) {
          setExchangeRates({
            USD: 1,
            GBP: data.rates.GBP || defaultExchangeRates.GBP,
            SLE: data.rates.SLE || defaultExchangeRates.SLE
          });
        }
      } catch (error) {
        console.warn("Failed to fetch latest exchange rates, using defaults:", error);
        // Keep using default rates if fetch fails
      }
    };

    fetchRates();
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  const convertPrice = (priceInUSD: number, targetCurrency?: Currency): number => {
    const currencyToUse = targetCurrency || currency;
    const rate = exchangeRates[currencyToUse];
    return priceInUSD * rate;
  };

  const formatPrice = (priceInUSD: number, targetCurrency?: Currency): string => {
    const currencyToUse = targetCurrency || currency;
    const symbol = currencySymbols[currencyToUse];
    const convertedPrice = convertPrice(priceInUSD, currencyToUse);
    
    // Format with appropriate decimal places
    let formatted: string;
    if (currencyToUse === "SLE") {
      // Sierra Leonean Leone typically doesn't use decimals
      formatted = Math.round(convertedPrice).toLocaleString();
    } else {
      // USD and GBP use 2 decimal places
      formatted = convertedPrice.toFixed(2);
    }
    
    return `${symbol}${formatted}`;
  };

  const getCurrencySymbol = (currencyToUse?: Currency): string => {
    return currencySymbols[currencyToUse || currency];
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRates,
        convertPrice,
        formatPrice,
        getCurrencySymbol
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
