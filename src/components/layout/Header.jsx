import { useState } from 'react';
import { useUser } from '../../auth/useUser';
import { useNavigation } from '../../App';
import './Header.css';

const Header = () => {
  const { user, logout } = useUser();
  const { activeMenu, setActiveMenu } = useNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  console.log(user)
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleMenuClick = (menuItem, event) => {
    event.preventDefault();
    setActiveMenu(menuItem);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Expense Tracker</h1>
            <span className="tagline">Smart Money Management</span>
          </div>
          
          <nav className="main-nav">
            <ul>
              <li>
                <a 
                  href="#dashboard" 
                  className={`nav-link ${activeMenu === 'dashboard' ? 'active' : ''}`}
                  onClick={(e) => handleMenuClick('dashboard', e)}
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="#expenses" 
                  className={`nav-link ${activeMenu === 'expenses' ? 'active' : ''}`}
                  onClick={(e) => handleMenuClick('expenses', e)}
                >
                  Expenses
                </a>
              </li>
              <li>
                <a 
                  href="#budget" 
                  className={`nav-link ${activeMenu === 'budget' ? 'active' : ''}`}
                  onClick={(e) => handleMenuClick('budget', e)}
                >
                  Budget
                </a>
              </li>
              <li>
                <a 
                  href="#reports" 
                  className={`nav-link ${activeMenu === 'reports' ? 'active' : ''}`}
                  onClick={(e) => handleMenuClick('reports', e)}
                >
                  Reports
                </a>
              </li>
            </ul>
          </nav>
          
          <div className="user-section" onClick={toggleDrawer}>
            <div className="user-info">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-currency">{user.preferences?.currency} - {user.preferences?.currencySymbol}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* User Details Drawer */}
      <div className={`user-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-overlay" onClick={closeDrawer}></div>
        <div className="drawer-content">
          <div className="drawer-header">
            <button className="close-btn" onClick={closeDrawer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="drawer-body">
            <div className="profile-avatar">
              <div className="large-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h4>{user.name}</h4>
            </div>
            
            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Currency</span>
                <span className="detail-value">{user.preferences?.currencySymbol || '₹'} ({user.preferences?.currency || 'INR'})</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="profile-actions">
              <button className="logout-drawer-btn" onClick={logout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
