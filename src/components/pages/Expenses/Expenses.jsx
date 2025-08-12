import React, { useState, useEffect } from 'react';
import { useUser } from '../../../auth/useUser';
import expenseService from '../../../services/expenseService';
import './Expenses.css';

const Expenses = () => {
  const { user } = useUser();
  const currencySymbol = user?.preferences?.currencySymbol || '₹';

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();

  // Check if navigated from dashboard with specific month/year/category
  const urlParams = new URLSearchParams(window.location.search);
  const paramMonth = urlParams.get('month');
  const paramYear = urlParams.get('year');
  const paramCategory = urlParams.get('category');

  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Filter states - using simple values
  const [selectedMonth, setSelectedMonth] = useState(paramMonth || currentMonth);
  const [selectedYear, setSelectedYear] = useState(paramYear || currentYear);
  const [filterCategory, setFilterCategory] = useState(paramCategory || '');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Get categories from service
  const categories = expenseService.getCategories();

  // Clear URL parameters after initial load
  useEffect(() => {
    if (paramMonth || paramYear || paramCategory) {
      // Clear URL parameters after they've been applied
      const url = new URL(window.location);
      url.searchParams.delete('month');
      url.searchParams.delete('year');
      url.searchParams.delete('category');
      window.history.replaceState({}, '', url);
    }
  }, []); // Run only once on mount

  // Load expenses from localStorage on component mount and when month/year changes
  useEffect(() => {
    // Clean up any invalid categories on component load (once per session)
    if (!window.expenseTrackerCategoriesCleanedUp) {
      const hasChanges = expenseService.cleanupInvalidCategories();
      if (hasChanges) {
        console.log('Invalid categories have been cleaned up');
      }
      window.expenseTrackerCategoriesCleanedUp = true;
    }

    const monthlyExpenses = expenseService.getExpensesByMonth(
      parseInt(selectedYear),
      parseInt(selectedMonth)
    );
    setExpenses(monthlyExpenses);
  }, [selectedMonth, selectedYear]);

  // Filter expenses based on search term and category (month/year filtering is handled by data loading)
  useEffect(() => {
    let filtered = expenses.filter(expense => {
      // Search filter
      const searchMatch = searchTerm === '' ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const categoryMatch = filterCategory === '' || expense.category === filterCategory;

      return searchMatch && categoryMatch;
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, filterCategory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description || !formData.category || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingExpense) {
        // Update existing expense
        const success = expenseService.updateExpense(editingExpense.id, formData);
        if (success) {
          // Reload expenses for current month
          const monthlyExpenses = expenseService.getExpensesByMonth(
            parseInt(selectedYear),
            parseInt(selectedMonth)
          );
          setExpenses(monthlyExpenses);
          setEditingExpense(null);
        } else {
          alert('Failed to update expense');
        }
      } else {
        // Add new expense
        expenseService.addExpense(formData);
        
        // Reload expenses for current month
        const monthlyExpenses = expenseService.getExpensesByMonth(
          parseInt(selectedYear),
          parseInt(selectedMonth)
        );
        setExpenses(monthlyExpenses);
      }

      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
    } catch (error) {
      // Handle category validation errors
      alert(error.message || 'An error occurred while saving the expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: expense.date
    });
    setShowAddForm(true);
  };

  const handleDelete = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      const success = expenseService.deleteExpense(expenseToDelete.id);
      if (success) {
        // Reload expenses for current month
        const monthlyExpenses = expenseService.getExpensesByMonth(
          parseInt(selectedYear),
          parseInt(selectedMonth)
        );
        setExpenses(monthlyExpenses);
        setShowDeleteConfirm(false);
        setExpenseToDelete(null);
      } else {
        alert('Failed to delete expense');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setExpenseToDelete(null);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingExpense(null);
    setFormData({
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const clearFilters = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setFilterCategory('');
    setSearchTerm('');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalTransactions = filteredExpenses.length;
  const uniqueCategories = [...new Set(filteredExpenses.map(expense => expense.category))].length;

  // Generate year options
  const currentYearNum = new Date().getFullYear();
  const years = [];
  for (let i = currentYearNum - 5; i <= currentYearNum + 1; i++) {
    years.push(i);
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  return (
    <div className="expenses-container">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filter Expenses</h3>
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="summary-card total-expenses">
          <h3>{months.find(m => m.value === parseInt(selectedMonth))?.label}, {selectedYear} Expenses</h3>
          <div className="amount">{currencySymbol}{totalExpenses.toFixed(2)}</div>
        </div>

        <div className="summary-card transactions">
          <h3>Transactions</h3>
          <div className="amount">{totalTransactions}</div>
        </div>

        <div className="summary-card categories">
          <h3>Categories</h3>
          <div className="amount">{uniqueCategories}</div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button className="close-btn" onClick={cancelForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="expense-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    step="1"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  name="description"
                  placeholder="What did you spend on?"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={cancelForm}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && expenseToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Expense</h3>
              <button className="close-btn" onClick={cancelDelete}>×</button>
            </div>

            <div className="delete-confirmation">
              <div className="delete-message">
                <div className="warning-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                </div>
                <h4>Are you sure you want to delete this expense?</h4>
                <div className="expense-details">
                  <p><strong>{expenseToDelete.description}</strong></p>
                  <p>{expenseToDelete.category} • {currencySymbol}{expenseToDelete.amount.toFixed(2)}</p>
                  <p>{new Date(expenseToDelete.date).toLocaleDateString()}</p>
                </div>
                <p className="warning-text">This action cannot be undone.</p>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={cancelDelete}>
                  Cancel
                </button>
                <button type="button" className="delete-confirm-btn" onClick={confirmDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="expenses-list">
        <div className="list-header">
          <h3>Recent Expenses</h3>
          <button className="add-expense-btn" onClick={() => setShowAddForm(true)}>
            + Add Expense
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="no-expenses">
            <h4>No expenses found</h4>
            <p>Add your first expense or adjust your filters</p>
          </div>
        ) : (
          <div className="expenses-grid">
            {filteredExpenses.map(expense => (
              <div key={expense.id} className="expense-item">
                <div className="expense-header">
                  <div className="expense-info">
                    <div className="expense-title">{expense.description}</div>
                    <div className="expense-meta">
                      <span className="category">{expense.category}</span>
                      <span className="date">{new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="expense-amount">
                    {currencySymbol}{expense.amount.toFixed(2)}
                  </div>
                  <div className="expense-actions">
                    <button className="edit-btn icon-btn" onClick={() => handleEdit(expense)} data-tooltip="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button className="delete-btn icon-btn" onClick={() => handleDelete(expense)} data-tooltip="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
