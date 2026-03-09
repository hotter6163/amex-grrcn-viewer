import type { GrrcnHeader, GrrcnTrailer, GrrcnFile } from '../lib/grrcn-types.ts';
import { formatDate, formatTime } from '../lib/grrcn-parser.ts';
import RecordDetail from './RecordDetail.tsx';

interface HeaderSectionProps {
  header: GrrcnHeader;
  trailer: GrrcnTrailer;
  recordCounts: GrrcnFile['recordCounts'];
}

export default function HeaderSection({ header, trailer, recordCounts }: HeaderSectionProps) {
  return (
    <div className="card header-section">
      <div className="card-header">
        <h2>File Information</h2>
      </div>
      <div className="card-body">
        <div className="info-grid">
          <div className="info-group">
            <h3>Header</h3>
            <div className="info-row">
              <span className="info-label">File Name</span>
              <span className="info-value">{header.fileName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">File ID</span>
              <span className="info-value">{header.fileId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Version</span>
              <span className="info-value">{header.fileVersionNumber}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Creation Date</span>
              <span className="info-value">{formatDate(header.fileCreationDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Creation Time</span>
              <span className="info-value">{formatTime(header.fileCreationTime)} MST</span>
            </div>
            <div className="info-row">
              <span className="info-label">Sequence Number</span>
              <span className="info-value">{header.sequentialNumber}</span>
            </div>
          </div>

          <div className="info-group">
            <h3>Trailer</h3>
            <div className="info-row">
              <span className="info-label">Sequence Number</span>
              <span className="info-value">{trailer.sequentialNumber}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Record Count</span>
              <span className="info-value">{trailer.totalRecordCount}</span>
            </div>
          </div>

          <div className="info-group">
            <h3>Record Counts (Parsed)</h3>
            <div className="counts-grid">
              <div className="count-item">
                <span className="count-label">Summary</span>
                <span className="count-value">{recordCounts.summary}</span>
              </div>
              <div className="count-item">
                <span className="count-label">Submission</span>
                <span className="count-value">{recordCounts.submission}</span>
              </div>
              <div className="count-item">
                <span className="count-label">Transaction</span>
                <span className="count-value">{recordCounts.transaction}</span>
              </div>
              <div className="count-item">
                <span className="count-label">Txn Pricing</span>
                <span className="count-value">{recordCounts.txnPricing}</span>
              </div>
              <div className="count-item">
                <span className="count-label">Chargeback</span>
                <span className="count-value">{recordCounts.chargeback}</span>
              </div>
              <div className="count-item">
                <span className="count-label">Adjustment</span>
                <span className="count-value">{recordCounts.adjustment}</span>
              </div>
              <div className="count-item">
                <span className="count-label">Fee/Revenue</span>
                <span className="count-value">{recordCounts.feeRevenue}</span>
              </div>
              <div className="count-item count-total">
                <span className="count-label">Total Lines</span>
                <span className="count-value">{recordCounts.total}</span>
              </div>
            </div>
          </div>
        </div>
        <RecordDetail record={header as unknown as Record<string, unknown>} label="Header Record Object" />
        <RecordDetail record={trailer as unknown as Record<string, unknown>} label="Trailer Record Object" />
      </div>
    </div>
  );
}
