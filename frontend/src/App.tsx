import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStrategyStore } from './stores/strategyStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Builder from './pages/Builder';
import Results from './pages/Results';

function App() {
  const theme = useStrategyStore((state) => state.theme);
  
  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
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
