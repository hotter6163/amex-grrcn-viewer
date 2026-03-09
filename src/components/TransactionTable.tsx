import { useState } from 'react';
import type { GrrcnTransaction } from '../lib/grrcn-types.ts';
import { formatDate, formatTime } from '../lib/grrcn-parser.ts';
import AmountDisplay from './AmountDisplay.tsx';
import TxnPricingDetail from './TxnPricingDetail.tsx';
import RecordDetail from './RecordDetail.tsx';

interface TransactionTableProps {
  transactions: GrrcnTransaction[];
  currency: string;
}

type SortKey = 'transactionDate' | 'transactionAmount' | 'cardmemberAccountNumber' | 'transactionId';
type SortDir = 'asc' | 'desc';

export default function TransactionTable({ transactions, currency }: TransactionTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('transactionDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (transactions.length === 0) return null;

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'transactionDate':
        cmp = a.transactionDate.localeCompare(b.transactionDate);
        break;
      case 'transactionAmount':
        cmp = a._transactionAmount - b._transactionAmount;
        break;
      case 'cardmemberAccountNumber':
        cmp = a.cardmemberAccountNumber.localeCompare(b.cardmemberAccountNumber);
        break;
      case 'transactionId':
        cmp = a.transactionId.localeCompare(b.transactionId);
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' \u2195';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <div className="transaction-table-wrapper">
      <table className="data-table transaction-table">
        <thead>
          <tr>
            <th className="expand-col"></th>
            <th className="sortable" onClick={() => handleSort('transactionDate')}>
              Date{sortIndicator('transactionDate')}
            </th>
            <th>Time</th>
            <th className="sortable" onClick={() => handleSort('transactionId')}>
              Transaction ID{sortIndicator('transactionId')}
            </th>
            <th className="sortable" onClick={() => handleSort('cardmemberAccountNumber')}>
              Card Number{sortIndicator('cardmemberAccountNumber')}
            </th>
            <th>Approval Code</th>
            <th>MCC</th>
            <th className="text-right sortable" onClick={() => handleSort('transactionAmount')}>
              Txn Amount{sortIndicator('transactionAmount')}
            </th>
            <th className="text-right">Gross Amount</th>
            <th>Acquirer Ref</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((txn, i) => {
            const hasPricing = txn.txnPricings.length > 0;
            const isExpanded = expandedRows.has(i);
            return (
              <tr key={i} className="txn-row-group">
                <td className="expand-col">
                  {hasPricing && (
                    <button
                      className="expand-btn"
                      onClick={() => toggleRow(i)}
                      title={isExpanded ? 'Collapse pricing' : 'Expand pricing'}
                    >
                      {isExpanded ? '\u25BC' : '\u25B6'}
                    </button>
                  )}
                </td>
                <td>{formatDate(txn.transactionDate)}</td>
                <td>{formatTime(txn.transactionTime)}</td>
                <td><code className="mono">{txn.transactionId}</code></td>
                <td><code className="mono">{txn.cardmemberAccountNumber}</code></td>
                <td><code>{txn.approvalCode}</code></td>
                <td>{txn.merchantCategoryCode}</td>
                <td className="text-right">
                  <AmountDisplay amount={txn._transactionAmount} currency={currency} raw={txn.transactionAmount} />
                </td>
                <td className="text-right">
                  <AmountDisplay amount={txn._submissionGrossAmountInPaymentCurrency} currency={currency} />
                </td>
                <td><code className="mono text-small">{txn.acquirerReferenceNumber}</code></td>
                <td>
                  <span className={`status-badge status-${txn.paymentStatus}`}>
                    {txn.paymentStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Expanded pricing rows rendered outside the table for layout flexibility */}
      {sorted.map((txn, i) => {
        if (!expandedRows.has(i) || txn.txnPricings.length === 0) return null;
        return (
          <div key={`pricing-${i}`} className="pricing-expanded">
            <div className="pricing-expanded-header">
              Pricing for Transaction {txn.transactionId}
            </div>
            <TxnPricingDetail pricings={txn.txnPricings} currency={currency} />
            <RecordDetail record={txn as unknown as Record<string, unknown>} label="Transaction Record Object" />
          </div>
        );
      })}
    </div>
  );
}
