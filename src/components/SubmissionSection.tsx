import { useState } from 'react';
import type { GrrcnSubmission } from '../lib/grrcn-types.ts';
import { formatDate } from '../lib/grrcn-parser.ts';
import AmountDisplay from './AmountDisplay.tsx';
import TransactionTable from './TransactionTable.tsx';
import RecordDetail from './RecordDetail.tsx';

interface SubmissionSectionProps {
  submissions: GrrcnSubmission[];
  currency: string;
}

export default function SubmissionSection({ submissions, currency }: SubmissionSectionProps) {
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set([0]));

  if (submissions.length === 0) return null;

  const toggleExpand = (idx: number) => {
    setExpandedIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="submissions-section">
      <h3 className="section-subtitle">
        Submissions ({submissions.length})
      </h3>
      {submissions.map((sub, idx) => {
        const isExpanded = expandedIdx.has(idx);
        return (
          <div key={idx} className="card submission-card">
            <div
              className="card-header clickable"
              onClick={() => toggleExpand(idx)}
            >
              <div className="submission-header-content">
                <span className="expand-indicator">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                <h4>
                  Submission #{idx + 1} - Merchant {sub.submissionMerchantId}
                </h4>
                <span className="submission-meta">
                  {formatDate(sub.businessSubmissionDate)} | {sub.transactionCount} txns |
                  Net: <AmountDisplay amount={sub._submissionNetAmount} currency={currency} />
                </span>
              </div>
            </div>
            {isExpanded && (
              <div className="card-body">
                <div className="submission-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Business Submission Date</span>
                      <span className="detail-value">{formatDate(sub.businessSubmissionDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Processing Date</span>
                      <span className="detail-value">{formatDate(sub.americanExpressProcessingDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Invoice Number</span>
                      <span className="detail-value"><code>{sub.submissionInvoiceNumber}</code></span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Submission Currency</span>
                      <span className="detail-value">{sub.submissionCurrency}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Exchange Rate</span>
                      <span className="detail-value">
                        {sub._submissionExchangeRate.toFixed(8)}
                        <span className="raw-value"> [{sub.submissionExchangeRate}]</span>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Transaction Count</span>
                      <span className="detail-value">{parseInt(sub.transactionCount, 10)}</span>
                    </div>
                    {sub.paymentStatus && (
                      <div className="detail-item">
                        <span className="detail-label">Payment Status</span>
                        <span className="detail-value">
                          <span className={`status-badge status-${sub.paymentStatus}`}>
                            {sub.paymentStatus}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="amount-breakdown">
                    <h5>Amount Breakdown</h5>
                    <table className="amount-table">
                      <tbody>
                        <tr>
                          <td>Gross (Submission Currency)</td>
                          <td className="text-right">
                            <AmountDisplay amount={sub._submissionGrossAmountInSubmissionCurrency} currency={sub.submissionCurrency} raw={sub.submissionGrossAmountInSubmissionCurrency} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Gross (Payment Currency)</td>
                          <td className="text-right">
                            <AmountDisplay amount={sub._submissionGrossAmountInPaymentCurrency} currency={currency} raw={sub.submissionGrossAmountInPaymentCurrency} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Discount</td>
                          <td className="text-right">
                            <AmountDisplay amount={sub._submissionDiscountAmount} currency={currency} raw={sub.submissionDiscountAmount} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Service Fee</td>
                          <td className="text-right">
                            <AmountDisplay amount={sub._submissionServiceFeeAmount} currency={currency} raw={sub.submissionServiceFeeAmount} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Tax</td>
                          <td className="text-right">
                            <AmountDisplay amount={sub._submissionTaxAmount} currency={currency} raw={sub.submissionTaxAmount} showRaw />
                          </td>
                        </tr>
                        <tr className="amount-total-row">
                          <td><strong>Net</strong></td>
                          <td className="text-right">
                            <AmountDisplay amount={sub._submissionNetAmount} currency={currency} raw={sub.submissionNetAmount} showRaw />
                          </td>
                        </tr>
                        {sub.submissionDiscountRate.trim() && (
                          <tr>
                            <td>Discount Rate</td>
                            <td className="text-right">
                              {(sub._submissionDiscountRate * 100).toFixed(3)}%
                              <span className="raw-value"> [{sub.submissionDiscountRate.trim()}]</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {sub._submissionDebitGrossAmount !== 0 || sub._submissionCreditGrossAmount !== 0 ? (
                    <div className="debit-credit-breakdown">
                      <h5>Debit/Credit Breakdown</h5>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Debit Gross</span>
                          <span className="detail-value">
                            <AmountDisplay amount={sub._submissionDebitGrossAmount} currency={currency} raw={sub.submissionDebitGrossAmount} showRaw />
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Credit Gross</span>
                          <span className="detail-value">
                            <AmountDisplay amount={sub._submissionCreditGrossAmount} currency={currency} raw={sub.submissionCreditGrossAmount} showRaw />
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <RecordDetail record={sub as unknown as Record<string, unknown>} label="Submission Record Object" />

                {sub.transactions.length > 0 && (
                  <div className="transactions-wrapper">
                    <h5>Transactions ({sub.transactions.length})</h5>
                    <TransactionTable transactions={sub.transactions} currency={currency} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
