import { useState } from 'react';
import type { GrrcnAdjustment } from '../lib/grrcn-types.ts';
import { formatDate } from '../lib/grrcn-parser.ts';
import AmountDisplay from './AmountDisplay.tsx';

interface AdjustmentSectionProps {
  adjustments: GrrcnAdjustment[];
  currency: string;
}

export default function AdjustmentSection({ adjustments, currency }: AdjustmentSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (adjustments.length === 0) return null;

  return (
    <div className="adjustments-section">
      <h3
        className="section-subtitle clickable"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="expand-indicator">{expanded ? '\u25BC' : '\u25B6'}</span>
        Adjustments ({adjustments.length})
      </h3>
      {expanded && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Adj Number</th>
                <th>Reason Code</th>
                <th>Description</th>
                <th>Processing Date</th>
                <th>Card Number</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj, i) => (
                <tr key={i}>
                  <td><code>{adj.adjustmentNumber}</code></td>
                  <td><code>{adj.adjustmentReasonCode}</code></td>
                  <td>{adj.adjustmentReasonDescription}</td>
                  <td>{formatDate(adj.americanExpressProcessingDate)}</td>
                  <td><code className="mono">{adj.cardmemberAccountNumber}</code></td>
                  <td className="text-right">
                    <AmountDisplay amount={adj._grossAmount} currency={currency} raw={adj.grossAmount} />
                  </td>
                  <td className="text-right">
                    <AmountDisplay amount={adj._discountAmount} currency={currency} />
                  </td>
                  <td className="text-right">
                    <AmountDisplay amount={adj._netAmount} currency={currency} raw={adj.netAmount} />
                  </td>
                  <td>
                    <span className={`status-badge status-${adj.paymentStatus}`}>
                      {adj.paymentStatus}
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
