interface AmountDisplayProps {
  amount: number;
  currency: string;
  raw?: string;
  showRaw?: boolean;
}

function getCurrencyDecimals(currency: string): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'ISK'];
  return zeroDecimalCurrencies.includes(currency.toUpperCase()) ? 0 : 2;
}

export default function AmountDisplay({ amount, currency, raw, showRaw = false }: AmountDisplayProps) {
  const decimals = getCurrencyDecimals(currency);
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const isNegative = amount < 0;
  const isZero = amount === 0;

  const className = isNegative
    ? 'amount amount-negative'
    : isZero
      ? 'amount amount-zero'
      : 'amount amount-positive';

  return (
    <span className={className}>
      <span className="amount-value">
        {isNegative ? '-' : ''}{formatted}
      </span>
      <span className="amount-currency"> {currency}</span>
      {showRaw && raw && (
        <span className="amount-raw" title="Raw value from file"> [{raw.trim()}]</span>
      )}
    </span>
  );
}
