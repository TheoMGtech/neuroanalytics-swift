import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Upload from './pages/analysis/Upload';
import Processing from './pages/analysis/Processing';
import Preview from './pages/analysis/Preview';
import Metrics from './pages/metrics/Metrics';
import Sentiment from './pages/metrics/Sentiment';
import Outliers from './pages/metrics/Outliers';
import Categories from './pages/metrics/Categories';
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
        <Route path="metrics" element={<Metrics />} />
        <Route path="sentiment" element={<Sentiment />} />
        <Route path="outliers" element={<Outliers />} />
        <Route path="categories" element={<Categories />} />
        
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
