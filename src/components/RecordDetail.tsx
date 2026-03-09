import { useState } from 'react';

interface RecordDetailProps {
  record: Record<string, unknown>;
  label?: string;
}

const CHILD_KEYS = ['submissions', 'chargebacks', 'adjustments', 'feeRevenues', 'transactions', 'txnPricings'];

function isChildOrParsed(key: string): boolean {
  return CHILD_KEYS.includes(key) || key.startsWith('_');
}

export default function RecordDetail({ record, label }: RecordDetailProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'table' | 'json'>('table');

  const rawEntries = Object.entries(record).filter(([k]) => !isChildOrParsed(k));
  const parsedEntries = Object.entries(record).filter(([k]) => k.startsWith('_'));

  return (
    <div className="record-detail-wrapper">
      <button className="record-detail-toggle" onClick={() => setOpen(!open)}>
        {open ? '\u25BC' : '\u25B6'} {label ?? 'Record Object'}
      </button>

      {open && (
        <div className="record-detail">
          <div className="record-detail-toolbar">
            <button
              className={`record-detail-mode-btn ${mode === 'table' ? 'active' : ''}`}
              onClick={() => setMode('table')}
            >
              Table
            </button>
            <button
              className={`record-detail-mode-btn ${mode === 'json' ? 'active' : ''}`}
              onClick={() => setMode('json')}
            >
              JSON
            </button>
          </div>

          {mode === 'table' ? (
            <div className="record-detail-table-wrapper">
              <table className="record-detail-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Field</th>
                    <th>Raw Value</th>
                    <th>Parsed</th>
                  </tr>
                </thead>
                <tbody>
                  {rawEntries.map(([key, val], i) => {
                    const parsedKey = `_${key}`;
                    const parsedVal = record[parsedKey];
                    return (
                      <tr key={key}>
                        <td className="record-detail-idx">{i}</td>
                        <td className="record-detail-key">{key}</td>
                        <td className="record-detail-val">
                          <code>{String(val ?? '')}</code>
                        </td>
                        <td className="record-detail-parsed">
                          {parsedVal !== undefined ? (
                            <code className="parsed-value">{String(parsedVal)}</code>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Show parsed-only entries that don't have a matching raw key */}
                  {parsedEntries
                    .filter(([k]) => !rawEntries.some(([rk]) => `_${rk}` === k))
                    .map(([key, val], i) => (
                      <tr key={key}>
                        <td className="record-detail-idx">{rawEntries.length + i}</td>
                        <td className="record-detail-key">{key}</td>
                        <td className="record-detail-val"></td>
                        <td className="record-detail-parsed">
                          <code className="parsed-value">{String(val)}</code>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="record-detail-json">{JSON.stringify(
              Object.fromEntries(
                Object.entries(record).filter(([k]) => !CHILD_KEYS.includes(k))
              ),
              null,
              2
            )}</pre>
          )}
        </div>
      )}
    </div>
  );
}
