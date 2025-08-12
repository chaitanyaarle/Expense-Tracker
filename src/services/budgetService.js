// BudgetService - Manages budget goals in localStorage

class BudgetService {
  constructor() {
    this.storageKey = 'expenseTracker_budgets';
    this.initializeStorage();
  }

  // Initialize storage with default structure if it doesn't exist
  initializeStorage() {
    const existingData = localStorage.getItem(this.storageKey);
    if (!existingData) {
      const defaultData = {
        budgets: [],
        lastBudgetId: 0
      };
      localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
    }
  }

  // Get all data from localStorage
  getData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  // Save data to localStorage
  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Get all budget goals
  getAllBudgets() {
    const data = this.getData();
    return data.budgets.sort((a, b) => {
      // Sort by automatic achievement status first (active before achieved), then by creation date
      const aAchieved = a.saved >= a.goal;
      const bAchieved = b.saved >= b.goal;
      
      if (aAchieved !== bAchieved) {
        return aAchieved - bAchieved;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  // Get active budget goals (not achieved)
  getActiveBudgets() {
    const data = this.getData();
    return data.budgets.filter(budget => budget.saved < budget.goal);
  }

  // Get achieved budget goals
  getAchievedBudgets() {
    const data = this.getData();
    return data.budgets.filter(budget => budget.saved >= budget.goal);
  }

  // Add a new budget goal
  addBudget(budget) {
    const data = this.getData();
    
    // Validate required fields
    if (!budget.name || !budget.goal || budget.goal <= 0) {
      throw new Error('Budget name and goal amount are required');
    }

    // Generate new ID
    data.lastBudgetId += 1;
    const newBudget = {
      id: data.lastBudgetId,
      name: budget.name.trim(),
      description: budget.description?.trim() || '',
      goal: parseFloat(budget.goal),
      saved: parseFloat(budget.saved) || 0,
      color: budget.color || this.getRandomColor(),
      category: budget.category || 'General',
      priority: budget.priority || 'Medium',
      targetDate: budget.targetDate || null,
      isAchieved: false,
      achievedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate that saved amount doesn't exceed goal
    if (newBudget.saved > newBudget.goal) {
      newBudget.saved = newBudget.goal;
      newBudget.isAchieved = true;
      newBudget.achievedAt = new Date().toISOString();
    }

    data.budgets.push(newBudget);
    this.saveData(data);
    return newBudget;
  }

  // Update an existing budget
  updateBudget(budgetId, updatedBudget) {
    const data = this.getData();
    const budgetIndex = data.budgets.findIndex(budget => budget.id === budgetId);
    
    if (budgetIndex === -1) {
      throw new Error('Budget not found');
    }

    const existingBudget = data.budgets[budgetIndex];
    const updated = {
      ...existingBudget,
      name: updatedBudget.name?.trim() || existingBudget.name,
      description: updatedBudget.description?.trim() || existingBudget.description,
      goal: updatedBudget.goal !== undefined ? parseFloat(updatedBudget.goal) : existingBudget.goal,
      saved: updatedBudget.saved !== undefined ? parseFloat(updatedBudget.saved) : existingBudget.saved,
      color: updatedBudget.color || existingBudget.color,
      category: updatedBudget.category || existingBudget.category,
      priority: updatedBudget.priority || existingBudget.priority,
      targetDate: updatedBudget.targetDate !== undefined ? updatedBudget.targetDate : existingBudget.targetDate,
      updatedAt: new Date().toISOString()
    };

    // Check if goal is achieved
    if (updated.saved >= updated.goal && !updated.isAchieved) {
      updated.isAchieved = true;
      updated.achievedAt = new Date().toISOString();
    } else if (updated.saved < updated.goal && updated.isAchieved) {
      updated.isAchieved = false;
      updated.achievedAt = null;
    }

    data.budgets[budgetIndex] = updated;
    this.saveData(data);
    return updated;
  }

  // Delete a budget
  deleteBudget(budgetId) {
    const data = this.getData();
    const budgetIndex = data.budgets.findIndex(budget => budget.id === budgetId);
    
    if (budgetIndex === -1) {
      throw new Error('Budget not found');
    }

    data.budgets.splice(budgetIndex, 1);
    this.saveData(data);
    return true;
  }

  // Add money to a budget goal
  addMoney(budgetId, amount) {
    const data = this.getData();
    const budgetIndex = data.budgets.findIndex(budget => budget.id === budgetId);
    
    if (budgetIndex === -1) {
      throw new Error('Budget not found');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const budget = data.budgets[budgetIndex];
    const newSavedAmount = budget.saved + parseFloat(amount);
    
    // Update saved amount
    budget.saved = Math.min(newSavedAmount, budget.goal); // Don't exceed goal
    budget.updatedAt = new Date().toISOString();

    // Check if goal is achieved
    if (budget.saved >= budget.goal && !budget.isAchieved) {
      budget.isAchieved = true;
      budget.achievedAt = new Date().toISOString();
    }

    this.saveData(data);
    return budget;
  }

  // Get budget statistics
  getBudgetStats() {
    const budgets = this.getAllBudgets();
    const activeBudgets = budgets.filter(b => b.saved < b.goal);
    const achievedBudgets = budgets.filter(b => b.saved >= b.goal);
    
    const totalGoals = budgets.reduce((sum, b) => sum + b.goal, 0);
    const totalSaved = budgets.reduce((sum, b) => sum + b.saved, 0);
    const totalRemaining = totalGoals - totalSaved;
    
    return {
      totalBudgets: budgets.length,
      activeBudgets: activeBudgets.length,
      achievedBudgets: achievedBudgets.length,
      totalGoals,
      totalSaved,
      totalRemaining,
      averageProgress: budgets.length > 0 ? (totalSaved / totalGoals) * 100 : 0
    };
  }

  // Get random color for new budget
  getRandomColor() {
    const colors = [
      '#22c55e', '#06b6d4', '#f59e0b', '#8b5cf6', 
      '#ef4444', '#f97316', '#eab308', '#ec4899',
      '#14b8a6', '#84cc16', '#6366f1', '#d946ef'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Clear all budgets (for testing/reset)
  clearAllBudgets() {
    localStorage.removeItem(this.storageKey);
    this.initializeStorage();
  }

  // Get budget categories
  getCategories() {
    return [
      'Emergency Fund', 'Travel', 'Education', 'Electronics',
      'Home & Garden', 'Health', 'Investment', 'Vehicle',
      'Entertainment', 'Shopping', 'General', 'Other'
    ];
  }

  // Get priority levels
  getPriorities() {
    return ['High', 'Medium', 'Low'];
  }
}

// Export singleton instance
export const budgetService = new BudgetService();
export default budgetService;
