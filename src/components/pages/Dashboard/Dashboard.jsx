import React, { useState, useEffect } from 'react';
import { useUser } from '../../../auth/useUser';
import { useNavigation } from '../../../App';
import expenseService from '../../../services/expenseService';
import budgetService from '../../../services/budgetService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useUser();
  const { setActiveMenu } = useNavigation();
  const currencySymbol = user?.preferences?.currencySymbol || '₹';
  
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load data from expense service
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    try {
      // Get recent months with data
      const recentMonths = expenseService.getRecentMonthsWithData(6);
      
      // Format monthly expenses data
      const monthlyData = recentMonths.map(monthData => {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        return {
          month: `${monthNames[monthData.month - 1]} ${monthData.year}`,
          amount: monthData.totalAmount,
          year: monthData.year,
          monthNumber: monthData.month
        };
      });
      
      setMonthlyExpenses(monthlyData);
      setCurrentMonthExpenses(monthlyData[0]?.amount || 0);
      
      // Get current month's category breakdown
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const currentMonthStats = expenseService.getMonthlyStats(currentYear, currentMonth);
      
      // Convert category breakdown to dashboard format
      const categoryColors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', 
        '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6',
        '#f59e0b', '#84cc16', '#6366f1', '#d946ef'
      ];
      
      const categoryData = Object.entries(currentMonthStats.categoryBreakdown)
        .map(([category, data], index) => ({
          name: category,
          spent: data.amount,
          color: categoryColors[index % categoryColors.length]
        }))
        .sort((a, b) => b.spent - a.spent);
      
      setExpenseCategories(categoryData);
      
      // Get budget goals from service
      const activeBudgets = budgetService.getActiveBudgets();
      setBudgetGoals(activeBudgets.slice(0, 4)); // Show only first 4 for dashboard
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const getProgressPercentage = (current, total) => {
    return Math.min((current / total) * 100, 100);
  };

  const getCategoryPercentage = (categorySpent) => {
    return ((categorySpent / currentMonthExpenses) * 100);
  };

  const getMonthChange = (current, previous) => {
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNegative: change < 0
    };
  };

  const handlePreviousMonthClick = () => {
    // Navigate to expenses page with previous month filter
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const month = previousMonth.getMonth() + 1;
    const year = previousMonth.getFullYear();
    
    // Set URL parameters for the expenses page
    const url = new URL(window.location);
    url.searchParams.set('month', month.toString());
    url.searchParams.set('year', year.toString());
    window.history.pushState({}, '', url);
    
    // Navigate to expenses page
    setActiveMenu('expenses');
  };

  const handleMonthClick = (monthData, index) => {
    // Use the year and monthNumber from the formatted data
    const month = monthData.monthNumber;
    const year = monthData.year;
    
    // Set URL parameters for the expenses page
    const url = new URL(window.location);
    url.searchParams.set('month', month.toString());
    url.searchParams.set('year', year.toString());
    window.history.pushState({}, '', url);
    
    // Navigate to expenses page
    setActiveMenu('expenses');
  };

  const handleCategoryClick = (category) => {
    // Set URL parameters for the expenses page with category filter
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    const url = new URL(window.location);
    url.searchParams.set('month', month.toString());
    url.searchParams.set('year', year.toString());
    url.searchParams.set('category', category.name);
    window.history.pushState({}, '', url);
    
    // Navigate to expenses page
    setActiveMenu('expenses');
  };

  const getCardIllustration = (index) => {
    const illustrations = [
      // Current month - Active chart
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#22c55e" strokeWidth="2" fill="rgba(34, 197, 94, 0.1)"/>
        <path d="M8 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18" cy="6" r="3" fill="#22c55e"/>
      </svg>,
      // Previous month - Trending up
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17l6-6 4 4 8-8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 7h4v4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="2" width="20" height="20" rx="3" stroke="#3b82f6" strokeWidth="1.5" fill="rgba(59, 130, 246, 0.05)"/>
      </svg>,
      // Two months ago - Analytics
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#8b5cf6" strokeWidth="1.5" fill="rgba(139, 92, 246, 0.05)"/>
        <rect x="7" y="13" width="2" height="4" fill="#8b5cf6"/>
        <rect x="11" y="9" width="2" height="8" fill="#8b5cf6"/>
        <rect x="15" y="11" width="2" height="6" fill="#8b5cf6"/>
      </svg>,
      // Three months ago - Archive
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#6b7280" strokeWidth="1.5" fill="rgba(107, 114, 128, 0.05)"/>
        <path d="M9 9h6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 12h4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 15h2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ];
    return illustrations[index] || illustrations[3];
  };

  const createPieChart = (percentage, color, size = 80) => {
    // ...existing code...
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="pie-chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="progress-circle"
          />
        </svg>
        <div className="pie-chart-center">
          <span className="percentage">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>Welcome back! 👋</h1>
          <p>Here's your financial overview</p>
        </div>
      </div>
      
      <div className="dashboard-content">
        {/* Monthly Expenses Section */}
        <div className="monthly-section">
          <h3>Monthly Expenses</h3>
          <div className="monthly-cards">
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : monthlyExpenses.length === 0 ? (
              <div className="no-data-state">
                <p>No expense data available</p>
                <button onClick={() => setActiveMenu('expenses')} className="add-expense-btn">
                  Add Your First Expense
                </button>
              </div>
            ) : (
              monthlyExpenses.map((month, index) => {
                const isCurrentMonth = index === 0;
                // Compare current month with previous month (correct order)
                const change = index > 0 ? getMonthChange(month.amount, monthlyExpenses[index-1].amount) : null;
                
                return (
                  <div 
                    key={index} 
                    className={`month-card ${isCurrentMonth ? 'current' : ''}`}
                    onClick={() => handleMonthClick(month, index)}
                  >
                    <div className="card-header">
                      <h2 className="card-month">{month.month.split(' ')[0]}</h2>
                      <h4 className="card-year">, {month.month.split(' ')[1]}</h4>
                    </div>
                    <div className="card-amount-section">
                      <div className="amount-display">{formatCurrency(month.amount)}</div>
                      <div className="currency-bg">{currencySymbol}</div>
                    </div>
                    {change && (
                      <div className="card-footer">
                        <span className={`change-indicator ${change.isPositive ? 'positive' : 'negative'}`}>
                          {change.isPositive ? '↗' : '↘'} {change.percentage}%
                        </span>
                      </div>
                    )}
                    <div className="card-illustration">
                      {getCardIllustration(index)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="expense-breakdown">
          <h3>Expense Breakdown</h3>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : expenseCategories.length === 0 ? (
            <div className="no-data-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2" fill="none"/>
                <path d="M12 6v6l4 2" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No expense categories this month</p>
              <button onClick={() => setActiveMenu('expenses')} className="add-expense-btn">
                Add Expenses to See Breakdown
              </button>
            </div>
          ) : (
            <div className="breakdown-grid">
              {expenseCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="breakdown-item"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="breakdown-content">
                    <div className="breakdown-info">
                      <span className="category-name">{category.name}</span>
                      <span className="category-amount">{formatCurrency(category.spent)}</span>
                    </div>
                    <div className="breakdown-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${getCategoryPercentage(category.spent)}%`,
                          background: `linear-gradient(135deg, ${category.color}, ${category.color}CC)`
                        }}
                      ></div>
                    </div>
                    <div className="breakdown-percentage">
                      {getCategoryPercentage(category.spent).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Goals */}
        <div className="budget-section">
          <h3>Budget Goals</h3>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : budgetGoals.length === 0 ? (
            <div className="no-data-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2" fill="none"/>
              </svg>
              <p>No budget goals set yet</p>
              <button onClick={() => setActiveMenu('budget')} className="add-expense-btn">
                Create Your First Budget Goal
              </button>
            </div>
          ) : (
            <div className="budget-grid">
              {budgetGoals.map((goal, index) => (
                <div key={index} className="budget-card">
                  <div className="budget-info">
                    <h4>{goal.name}</h4>
                    <div className="budget-chart">
                      {createPieChart(getProgressPercentage(goal.saved, goal.goal), goal.color)}
                    </div>
                  </div>
                  <div className="budget-details">
                    <div className="budget-amounts">
                      <span className="saved">{formatCurrency(goal.saved)}</span>
                      <span className="target">/ {formatCurrency(goal.goal)}</span>
                    </div>
                    <div className="remaining">{formatCurrency(goal.goal - goal.saved)} left</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
