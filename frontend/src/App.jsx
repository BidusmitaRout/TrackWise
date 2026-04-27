import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import LegacyPage from './legacy/LegacyPage';
import { legacyRoutes } from './legacy/routes';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {legacyRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<LegacyPage html={route.html} title={route.title} />}
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
