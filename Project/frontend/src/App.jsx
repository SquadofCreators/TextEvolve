import { useEffect } from 'react';
import './App.css';
import LandingPage from './pages/LandingPage';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  );
}

export default App;
