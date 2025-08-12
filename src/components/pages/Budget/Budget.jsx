import React, { useState, useEffect } from 'react';
import { useUser } from '../../../auth/useUser';
import budgetService from '../../../services/budgetService';
import './Budget.css';

const Budget = () => {
  const { user } = useUser();
  const currencySymbol = user?.preferences?.currencySymbol || '₹';

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyBudget, setAddMoneyBudget] = useState(null);
  const [filter, setFilter] = useState('active'); // active, achieved

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    saved: '0',
    color: '#22c55e'
  });

  const [addMoneyAmount, setAddMoneyAmount] = useState('');

  // Load budgets on component mount
  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = () => {
    try {
      const allBudgets = budgetService.getAllBudgets();
      setBudgets(allBudgets);
      setLoading(false);
    } catch (error) {
      console.error('Error loading budgets:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.goal) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingBudget) {
        // When editing, preserve the original saved amount
        const updateData = {
          ...formData,
          saved: editingBudget.saved // Keep the original saved amount
        };
        budgetService.updateBudget(editingBudget.id, updateData);
      } else {
        budgetService.addBudget(formData);
      }

      loadBudgets();
      resetForm();
    } catch (error) {
      alert(error.message || 'An error occurred while saving the budget');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      goal: '',
      saved: '0',
      color: '#22c55e'
    });
    setShowAddForm(false);
    setEditingBudget(null);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      description: budget.description,
      goal: budget.goal.toString(),
      saved: budget.saved.toString(), // Keep for display but make read-only
      color: budget.color
    });
    setShowAddForm(true);
  };

  const handleDelete = (budget) => {
    setBudgetToDelete(budget);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    try {
      budgetService.deleteBudget(budgetToDelete.id);
      loadBudgets();
      setShowDeleteConfirm(false);
      setBudgetToDelete(null);
    } catch (error) {
      alert(error.message || 'Failed to delete budget');
    }
  };

  const handleAddMoney = (budget) => {
    setAddMoneyBudget(budget);
    setAddMoneyAmount('');
    setShowAddMoneyModal(true);
  };

  const confirmAddMoney = () => {
    if (!addMoneyAmount || parseFloat(addMoneyAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      budgetService.addMoney(addMoneyBudget.id, parseFloat(addMoneyAmount));
      loadBudgets();
      setShowAddMoneyModal(false);
      setAddMoneyBudget(null);
      setAddMoneyAmount('');
    } catch (error) {
      alert(error.message || 'Failed to add money');
    }
  };

  const getFilteredBudgets = () => {
    switch (filter) {
      case 'active':
        return budgets.filter(budget => budget.saved < budget.goal);
      case 'achieved':
        return budgets.filter(budget => budget.saved >= budget.goal);
      default:
        return budgets.filter(budget => budget.saved < budget.goal); // default to active
    }
  };

  const getProgressPercentage = (saved, goal) => {
    return Math.min((saved / goal) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const createProgressChart = (percentage, color, size = 60) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-chart" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="progress-text">
          <span className="percentage">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  const filteredBudgets = getFilteredBudgets();
  const stats = budgetService.getBudgetStats();

  if (loading) {
    return (
      <div className="budget-page">
        <div className="loading">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="budget-page">
      <div className="page-header">
        <h2>Budget Planning</h2>
        <p>Create and track your financial goals</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">{stats.totalBudgets}</div>
          <div className="stat-label">Total Budgets</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.activeBudgets}</div>
          <div className="stat-label">Active Goals</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.achievedBudgets}</div>
          <div className="stat-label">Achieved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatCurrency(stats.totalSaved)}</div>
          <div className="stat-label">Total Saved</div>
        </div>
      </div>

      {/* Controls */}
      <div className="budget-controls">
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({stats.activeBudgets})
          </button>
          <button 
            className={`filter-btn ${filter === 'achieved' ? 'active' : ''}`}
            onClick={() => setFilter('achieved')}
          >
            Achieved ({stats.achievedBudgets})
          </button>
        </div>
        <button className="add-budget-btn" onClick={() => setShowAddForm(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Budget Goal
        </button>
      </div>

      {/* Budget List */}
      <div className="budget-list">
        {filteredBudgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No Budget Goals Yet</h3>
            <p>Start by creating your first budget goal to track your savings.</p>
            <button className="add-budget-btn" onClick={() => setShowAddForm(true)}>
              Create Your First Budget
            </button>
          </div>
        ) : (
          filteredBudgets.map((budget) => {
            const progress = getProgressPercentage(budget.saved, budget.goal);
            const isAchieved = budget.saved >= budget.goal; // Auto-achieved when goal is reached
            
            return isAchieved ? (
              // ✓ ACHIEVED - Same as Active but No Actions
              <div key={budget.id} className="budget-card achieved">
                <div className="budget-header">
                  <div className="budget-info">
                    <h3 className="budget-name">{budget.name}</h3>
                    {budget.description && (
                      <p className="budget-description">{budget.description}</p>
                    )}
                  </div>
                </div>

                <div className="budget-progress">
                  <div className="progress-visual">
                    {createProgressChart(progress, budget.color, 80)}
                  </div>
                  <div className="progress-details">
                    <div className="progress-amounts">
                      <div className="amount-goal">
                        <span className="value">{formatCurrency(budget.goal)}</span>
                      </div>
                    </div>
                    <div className="progress-remaining">
                      <span className="remaining-amount">
                        Goal Achieved ✓
                      </span>
                    </div>
                    {budget.targetDate && (
                      <div className="target-date">
                        <span>Target: {new Date(budget.targetDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div key={budget.id} className="budget-card">
                  <>
                    <div className="budget-header">
                      <div className="budget-info">
                        <h3 className="budget-name">{budget.name}</h3>
                      </div>
                      <div className="budget-actions">
                        <button 
                          className="action-btn add-money-btn"
                          onClick={() => handleAddMoney(budget)}
                          data-tooltip="Add Money"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(budget)}
                          data-tooltip="Edit Goal"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(budget)}
                          data-tooltip="Delete Goal"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="budget-progress">
                      <div className="progress-visual">
                        {createProgressChart(progress, budget.color, 80)}
                      </div>
                      <div className="progress-details">
                        <div className="progress-amounts">
                          <div className="amount-saved">
                            <span className="label">Saved</span>
                            <span className="value">{formatCurrency(budget.saved)}</span>
                          </div>
                          <div className="amount-goal">
                            <span className="label">Goal</span>
                            <span className="value">{formatCurrency(budget.goal)}</span>
                          </div>
                        </div>
                        <div className="progress-remaining">
                          <span className="remaining-amount">
                            {formatCurrency(budget.goal - budget.saved)} remaining
                          </span>
                        </div>
                        {budget.targetDate && (
                          <div className="target-date">
                            <span>Target: {new Date(budget.targetDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                </div>
              
            );
          })
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingBudget ? 'Edit Budget Goal' : 'Add Budget Goal'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="budget-form">
              <div className="form-group">
                <label>Goal Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Emergency Fund, New Car, Vacation"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Brief description of your goal"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Amount *</label>
                  <input
                    type="number"
                    name="goal"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={formData.goal}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {!editingBudget && (
                  <div className="form-group">
                    <label>Current Amount</label>
                    <input
                      type="number"
                      name="saved"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={formData.saved}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Goal Color</label>
                <div className="color-picker">
                  {['#22c55e', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316', '#eab308', '#ec4899'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoneyModal && addMoneyBudget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Money to "{addMoneyBudget.name}"</h3>
              <button className="close-btn" onClick={() => setShowAddMoneyModal(false)}>×</button>
            </div>

            <div className="add-money-form">
              <div className="current-progress">
                <p>Current Progress: {formatCurrency(addMoneyBudget.saved)} / {formatCurrency(addMoneyBudget.goal)}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${getProgressPercentage(addMoneyBudget.saved, addMoneyBudget.goal)}%`,
                      backgroundColor: addMoneyBudget.color 
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Amount to Add *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Enter amount"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowAddMoneyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="submit-btn" 
                  onClick={confirmAddMoney}
                >
                  Add {addMoneyAmount ? formatCurrency(parseFloat(addMoneyAmount)) : 'Money'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && budgetToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Budget Goal</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>

            <div className="delete-confirmation">
              <p>Are you sure you want to delete "<strong>{budgetToDelete.name}</strong>"?</p>
              <p className="warning">This action cannot be undone.</p>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="delete-btn" 
                  onClick={confirmDelete}
                >
                  Delete Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;
