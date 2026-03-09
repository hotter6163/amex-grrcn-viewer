import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseGrrcnFile } from '../lib/grrcn-parser.ts';
import type { GrrcnFile } from '../lib/grrcn-types.ts';

interface UploadPageProps {
  onFileLoaded: (data: GrrcnFile, fileName: string) => void;
}

export default function UploadPage({ onFileLoaded }: UploadPageProps) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback((file: File) => {
    setError(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseGrrcnFile(content);
        onFileLoaded(parsed, file.name);
        navigate('/viewer');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, [onFileLoaded, navigate]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-hero">
          <h1>AMEX GRRCN Viewer</h1>
          <p className="upload-description">
            Upload a GRRCN (Global Raw Data Reconciliation) file to view its contents
            in a structured, hierarchical format.
          </p>
        </div>

        <div
          className={`drop-zone ${isDragging ? 'drop-zone-active' : ''} ${isLoading ? 'drop-zone-loading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Parsing file...</p>
            </div>
          ) : (
            <>
              <div className="drop-zone-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="drop-zone-text">
                Drag and drop your .decrypted GRRCN file here
              </p>
              <p className="drop-zone-or">or</p>
              <label className="file-input-label">
                Browse Files
                <input
                  type="file"
                  accept=".decrypted,.csv,.txt"
                  onChange={handleFileInput}
                  className="file-input-hidden"
                />
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="upload-info">
          <h3>Supported Format</h3>
          <ul>
            <li>GRRCN v4.01 CSV files (.decrypted)</li>
            <li>Record types: HEADER, SUMMARY, SUBMISSION, TRANSACTN, TXNPRICING, CHARGEBACK, ADJUSTMENT, FEEREVENUE, TRAILER</li>
            <li>All data is processed locally in your browser - nothing is uploaded to any server</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
