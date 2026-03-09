import type { GrrcnTxnPricing } from '../lib/grrcn-types.ts';
import { getFeeCodeDescription } from '../lib/grrcn-parser.ts';
import AmountDisplay from './AmountDisplay.tsx';

interface TxnPricingDetailProps {
  pricings: GrrcnTxnPricing[];
  currency: string;
}

export default function TxnPricingDetail({ pricings, currency }: TxnPricingDetailProps) {
  if (pricings.length === 0) return null;

  return (
    <div className="txn-pricing-detail">
      <table className="data-table pricing-table">
        <thead>
          <tr>
            <th>Fee Code</th>
            <th>Description</th>
            <th className="text-right">Txn Amount</th>
            <th className="text-right">Discount Rate</th>
            <th className="text-right">Fee Amount</th>
            <th className="text-right">Discount Amount</th>
            <th className="text-right">Rounded Fee (Settle)</th>
            <th className="text-right">Rounded Discount (Settle)</th>
          </tr>
        </thead>
        <tbody>
          {pricings.map((p, i) => (
            <tr key={i}>
              <td><code>{p.feeCode}</code></td>
              <td>{getFeeCodeDescription(p.feeCode)}</td>
              <td className="text-right">
                <AmountDisplay amount={p._transactionAmount} currency={currency} raw={p.transactionAmount} />
              </td>
              <td className="text-right">
                {p._discountRate !== 0 ? `${(p._discountRate * 100).toFixed(3)}%` : '-'}
                {p.discountRate.trim() && (
                  <span className="raw-value"> [{p.discountRate.trim()}]</span>
                )}
              </td>
              <td className="text-right">
                <AmountDisplay amount={p._feeAmount} currency={currency} raw={p.feeAmount} />
              </td>
              <td className="text-right">
                <AmountDisplay amount={p._discountAmount} currency={currency} raw={p.discountAmount} />
              </td>
              <td className="text-right">
                <AmountDisplay amount={p._roundedFeeAmountSettlementCurrency} currency={currency} raw={p.roundedFeeAmountSettlementCurrency} />
              </td>
              <td className="text-right">
                <AmountDisplay amount={p._roundedDiscountAmountSettlementCurrency} currency={currency} raw={p.roundedDiscountAmountSettlementCurrency} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
