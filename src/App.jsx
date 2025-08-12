import { useState, createContext, useContext } from 'react'
import './App.css'
import { UserProvider, useUser } from './auth/useUser'
import Auth from './auth/auth'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Dashboard from './components/pages/Dashboard/Dashboard'
import Expenses from './components/pages/Expenses/Expenses'
import Reports from './components/pages/Reports/Reports'
import Budget from './components/pages/Budget/Budget'

// Navigation Context
const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Navigation Provider
const NavigationProvider = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <NavigationContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </NavigationContext.Provider>
  );
};

// Main app component that uses the user context
function AppContent() {
  const { isAuthenticated } = useUser();
  const { activeMenu } = useNavigation();

  if (!isAuthenticated) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'budget':
        return <Budget />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="main-content">
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Root App component with UserProvider
function App() {
  return (
    <UserProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </UserProvider>
  );
}

export default App
