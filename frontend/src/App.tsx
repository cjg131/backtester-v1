import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Builder from '@/pages/BuilderNew';
import Results from './pages/Results';
import Templates from './pages/Templates';
import Compare from './pages/Compare';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="templates" element={<Templates />} />
          <Route path="compare" element={<Compare />} />
          <Route path="builder" element={<Builder />} />
          <Route path="builder/:id" element={<Builder />} />
          <Route path="results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
