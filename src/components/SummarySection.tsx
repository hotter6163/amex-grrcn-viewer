import { useState } from 'react';
import type { GrrcnSummary } from '../lib/grrcn-types.ts';
import { formatDate, getSettlementAccountType, getPaymentStatus } from '../lib/grrcn-parser.ts';
import AmountDisplay from './AmountDisplay.tsx';
import SubmissionSection from './SubmissionSection.tsx';
import ChargebackSection from './ChargebackSection.tsx';
import AdjustmentSection from './AdjustmentSection.tsx';
import RecordDetail from './RecordDetail.tsx';

interface SummarySectionProps {
  summaries: GrrcnSummary[];
}

export default function SummarySection({ summaries }: SummarySectionProps) {
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set([0]));

  if (summaries.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-muted">No payment summaries found in this file.</p>
        </div>
      </div>
    );
  }

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
    <div className="summaries-section">
      {summaries.map((summary, idx) => {
        const isExpanded = expandedIdx.has(idx);
        const currency = summary.paymentCurrency;
        const acctType = getSettlementAccountType(summary.settlementAccountTypeCode);

        return (
          <div key={idx} className="card summary-card">
            <div
              className="card-header summary-header clickable"
              onClick={() => toggleExpand(idx)}
            >
              <div className="summary-header-content">
                <span className="expand-indicator">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                <div className="summary-title">
                  <h2>
                    Payment #{summary.americanExpressPaymentNumber}
                  </h2>
                  <div className="summary-badges">
                    <span className="badge badge-account-type">{acctType}</span>
                    <span className={`status-badge status-${summary.paymentStatus}`}>
                      {getPaymentStatus(summary.paymentStatus)}
                    </span>
                  </div>
                </div>
                <div className="summary-quick-info">
                  <span>{formatDate(summary.paymentDate)}</span>
                  <span className="summary-net-amount">
                    Net: <AmountDisplay amount={summary._paymentNetAmount} currency={currency} />
                  </span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="card-body">
                <div className="summary-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Payee Merchant ID</span>
                      <span className="detail-value"><code>{summary.payeeMerchantId}</code></span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Settlement Account</span>
                      <span className="detail-value">{acctType} ({summary.settlementAccountTypeCode})</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Payment Date</span>
                      <span className="detail-value">{formatDate(summary.paymentDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Currency</span>
                      <span className="detail-value">{currency}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Unique Payment Ref</span>
                      <span className="detail-value"><code>{summary.uniquePaymentReferenceNumber}</code></span>
                    </div>
                    {summary.payeeDirectDepositNumber && (
                      <div className="detail-item">
                        <span className="detail-label">Direct Deposit #</span>
                        <span className="detail-value">{summary.payeeDirectDepositNumber}</span>
                      </div>
                    )}
                    {summary.bankAccountNumber && (
                      <div className="detail-item">
                        <span className="detail-label">Bank Account</span>
                        <span className="detail-value">{summary.bankAccountNumber}</span>
                      </div>
                    )}
                    {summary.internationalBankAccountNumber && (
                      <div className="detail-item">
                        <span className="detail-label">IBAN</span>
                        <span className="detail-value">{summary.internationalBankAccountNumber}</span>
                      </div>
                    )}
                    {summary.bankIdentifierCode && (
                      <div className="detail-item">
                        <span className="detail-label">BIC</span>
                        <span className="detail-value">{summary.bankIdentifierCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="amount-breakdown">
                    <h4>Payment Amount Breakdown</h4>
                    <table className="amount-table">
                      <tbody>
                        <tr>
                          <td>Gross Amount</td>
                          <td className="text-right">
                            <AmountDisplay amount={summary._paymentGrossAmount} currency={currency} raw={summary.paymentGrossAmount} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Discount Amount</td>
                          <td className="text-right">
                            <AmountDisplay amount={summary._paymentDiscountAmount} currency={currency} raw={summary.paymentDiscountAmount} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Service Fee Amount</td>
                          <td className="text-right">
                            <AmountDisplay amount={summary._paymentServiceFeeAmount} currency={currency} raw={summary.paymentServiceFeeAmount} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Adjustment Amount</td>
                          <td className="text-right">
                            <AmountDisplay amount={summary._paymentAdjustmentAmount} currency={currency} raw={summary.paymentAdjustmentAmount} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Tax Amount</td>
                          <td className="text-right">
                            <AmountDisplay amount={summary._paymentTaxAmount} currency={currency} raw={summary.paymentTaxAmount} showRaw />
                          </td>
                        </tr>
                        <tr>
                          <td>Opening Debit Balance</td>
                          <td className="text-right">
                            <AmountDisplay amount={summary._openingDebitBalanceAmount} currency={currency} raw={summary.openingDebitBalanceAmount} showRaw />
                          </td>
                        </tr>
                        <tr className="amount-total-row">
                          <td><strong>Net Amount</strong></td>
                          <td className="text-right">
                            <AmountDisplay amount={summary._paymentNetAmount} currency={currency} raw={summary.paymentNetAmount} showRaw />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <RecordDetail record={summary as unknown as Record<string, unknown>} label="Summary Record Object" />

                <SubmissionSection submissions={summary.submissions} currency={currency} />
                <ChargebackSection chargebacks={summary.chargebacks} currency={currency} />
                <AdjustmentSection adjustments={summary.adjustments} currency={currency} />

                {summary.feeRevenues.length > 0 && (
                  <div className="fee-revenue-section">
                    <h3 className="section-subtitle">Fee/Revenue ({summary.feeRevenues.length})</h3>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Merchant</th>
                          <th>Location</th>
                          <th>Description</th>
                          <th className="text-right">Fee/Revenue Amt</th>
                          <th>Billing Description</th>
                          <th className="text-right">Billing Amt</th>
                          <th className="text-right">Billing Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.feeRevenues.map((fr, i) => (
                          <tr key={i} title="Click row to see record detail">
                            <td><code>{fr.submissionMerchantId}</code></td>
                            <td>{fr.merchantLocationId}</td>
                            <td>{fr.feeOrRevenueDescription}</td>
                            <td className="text-right">
                              <AmountDisplay amount={fr._feeOrRevenueAmount} currency={currency} />
                            </td>
                            <td>{fr.assetBillingDescription}</td>
                            <td className="text-right">
                              <AmountDisplay amount={fr._assetBillingAmount} currency={currency} />
                            </td>
                            <td className="text-right">
                              <AmountDisplay amount={fr._assetBillingTax} currency={currency} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {summary.feeRevenues.map((fr, fi) => (
                      <RecordDetail key={fi} record={fr as unknown as Record<string, unknown>} label={`FeeRevenue #${fi + 1} Record Object`} />
                    ))}
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
