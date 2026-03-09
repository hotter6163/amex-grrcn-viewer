import { useNavigate } from 'react-router-dom';
import type { GrrcnFile } from '../lib/grrcn-types.ts';
import HeaderSection from '../components/HeaderSection.tsx';
import SummarySection from '../components/SummarySection.tsx';

interface ViewerPageProps {
  data: GrrcnFile | null;
  fileName: string;
}

export default function ViewerPage({ data, fileName }: ViewerPageProps) {
  const navigate = useNavigate();

  if (!data) {
    return (
      <div className="viewer-page">
        <div className="no-data">
          <h2>No file loaded</h2>
          <p>Please upload a GRRCN file first.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-page">
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Upload New File
          </button>
          <span className="toolbar-filename">{fileName}</span>
        </div>
        <div className="toolbar-right">
          <span className="toolbar-info">
            {data.recordCounts.total} records | {data.recordCounts.summary} payments
          </span>
        </div>
      </div>

      <HeaderSection
        header={data.header}
        trailer={data.trailer}
        recordCounts={data.recordCounts}
      />

      <SummarySection summaries={data.summaries} />
    </div>
  );
}
