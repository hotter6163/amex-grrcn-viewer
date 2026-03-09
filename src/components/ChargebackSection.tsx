import { useState } from 'react';
import type { GrrcnChargeback } from '../lib/grrcn-types.ts';
import { formatDate } from '../lib/grrcn-parser.ts';
import AmountDisplay from './AmountDisplay.tsx';

interface ChargebackSectionProps {
  chargebacks: GrrcnChargeback[];
  currency: string;
}

export default function ChargebackSection({ chargebacks, currency }: ChargebackSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (chargebacks.length === 0) return null;

  return (
    <div className="chargebacks-section">
      <h3
        className="section-subtitle clickable"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="expand-indicator">{expanded ? '\u25BC' : '\u25B6'}</span>
        Chargebacks ({chargebacks.length})
      </h3>
      {expanded && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>CB Number</th>
                <th>Reason Code</th>
                <th>Description</th>
                <th>Processing Date</th>
                <th>Card Number</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Net</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {chargebacks.map((cb, i) => (
                <tr key={i}>
                  <td><code>{cb.chargebackNumber}</code></td>
                  <td><code>{cb.chargebackReasonCode}</code></td>
                  <td>{cb.chargebackReasonDescription}</td>
                  <td>{formatDate(cb.americanExpressProcessingDate)}</td>
                  <td><code className="mono">{cb.cardmemberAccountNumber}</code></td>
                  <td className="text-right">
                    <AmountDisplay amount={cb._grossAmount} currency={currency} raw={cb.grossAmount} />
                  </td>
                  <td className="text-right">
                    <AmountDisplay amount={cb._discountAmount} currency={currency} />
                  </td>
                  <td className="text-right">
                    <AmountDisplay amount={cb._netAmount} currency={currency} raw={cb.netAmount} />
                  </td>
                  <td><code className="mono">{cb.transactionId}</code></td>
                  <td>
                    <span className={`status-badge status-${cb.paymentStatus}`}>
                      {cb.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
