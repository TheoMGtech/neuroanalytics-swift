import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Upload from './pages/analysis/Upload';
import Processing from './pages/analysis/Processing';
import Preview from './pages/analysis/Preview';

// Novas Telas de Análise
import ComparacaoNPS from './pages/analysis/ComparacaoNPS';
import Gestao from './pages/analysis/Gestao';
import Grupos from './pages/analysis/Grupos';
import Lojas from './pages/analysis/Lojas';
import Explicabilidade from './pages/analysis/Explicabilidade';
import Comentarios from './pages/analysis/Comentarios';

import HistoryList from './pages/history/HistoryList';
import HistoryDetail from './pages/history/HistoryDetail';
import Settings from './pages/settings/Settings';
import InvalidBase from './pages/error/InvalidBase';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated Layout */}
      <Route path="/app" element={<MainLayout />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Analysis Flow */}
        <Route path="upload" element={<Upload />} />
        <Route path="processing" element={<Processing />} />
        <Route path="preview" element={<Preview />} />
        
        {/* Visualizations */}
        <Route path="comparacao" element={<ComparacaoNPS />} />
        <Route path="gestao" element={<Gestao />} />
        <Route path="grupos" element={<Grupos />} />
        <Route path="lojas" element={<Lojas />} />
        <Route path="explicabilidade" element={<Explicabilidade />} />
        <Route path="comentarios" element={<Comentarios />} />
        
        {/* History */}
        <Route path="history" element={<HistoryList />} />
        <Route path="history/:id" element={<HistoryDetail />} />
        
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
        
        {/* Errors */}
        <Route path="error/invalid-base" element={<InvalidBase />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
