import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { GrrcnFile } from './lib/grrcn-types.ts';
import UploadPage from './pages/UploadPage.tsx';
import ViewerPage from './pages/ViewerPage.tsx';

export default function App() {
  const [grrcnData, setGrrcnData] = useState<GrrcnFile | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileLoaded = (data: GrrcnFile, name: string) => {
    setGrrcnData(data);
    setFileName(name);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<UploadPage onFileLoaded={handleFileLoaded} />} />
          <Route path="/viewer" element={<ViewerPage data={grrcnData} fileName={fileName} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
