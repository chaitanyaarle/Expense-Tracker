// ExpenseService - Manages expense data in localStorage with organized month/year structure

class ExpenseService {
  constructor() {
    this.storageKey = 'expenseTracker_data';
    this.initializeStorage();
  }

  // Initialize storage with default structure if it doesn't exist
  initializeStorage() {
    const existingData = localStorage.getItem(this.storageKey);
    if (!existingData) {
      const defaultData = {
        expenses: {},
        categories: [
          'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
          'Bills & Utilities', 'Healthcare', 'Travel', 'Education',
          'Groceries', 'Gas', 'Insurance', 'Other'
        ],
        lastExpenseId: 0
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

  // Get month key format (YYYY-MM)
  getMonthKey(year, month) {
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  // Get month key from date string
  getMonthKeyFromDate(dateString) {
    const date = new Date(dateString);
    return this.getMonthKey(date.getFullYear(), date.getMonth() + 1);
  }

  // Get expenses for a specific month/year
  getExpensesByMonth(year, month) {
    const data = this.getData();
    const monthKey = this.getMonthKey(year, month);
    return data.expenses[monthKey] || [];
  }

  // Get all expenses (flattened from all months)
  getAllExpenses() {
    const data = this.getData();
    const allExpenses = [];
    
    Object.values(data.expenses).forEach(monthExpenses => {
      allExpenses.push(...monthExpenses);
    });
    
    return allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Add a new expense
  addExpense(expense) {
    const data = this.getData();
    const monthKey = this.getMonthKeyFromDate(expense.date);
    
    // Validate category
    if (!this.isValidCategory(expense.category)) {
      throw new Error(`Invalid category "${expense.category}". Please select a valid category.`);
    }
    
    // Generate new ID
    data.lastExpenseId += 1;
    const newExpense = {
      ...expense,
      id: data.lastExpenseId,
      amount: parseFloat(expense.amount)
    };
    
    // Initialize month array if it doesn't exist
    if (!data.expenses[monthKey]) {
      data.expenses[monthKey] = [];
    }
    
    // Add expense to the appropriate month
    data.expenses[monthKey].push(newExpense);
    
    // Sort expenses within the month by date (newest first)
    data.expenses[monthKey].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.saveData(data);
    return newExpense;
  }

  // Update an existing expense
  updateExpense(expenseId, updatedExpense) {
    const data = this.getData();
    let found = false;
    
    // Validate category
    if (!this.isValidCategory(updatedExpense.category)) {
      throw new Error(`Invalid category "${updatedExpense.category}". Please select a valid category.`);
    }
    
    // Find and update the expense in the appropriate month
    Object.keys(data.expenses).forEach(monthKey => {
      const expenseIndex = data.expenses[monthKey].findIndex(exp => exp.id === expenseId);
      if (expenseIndex !== -1) {
        // Remove from old month
        const oldExpense = data.expenses[monthKey][expenseIndex];
        data.expenses[monthKey].splice(expenseIndex, 1);
        
        // Add to new month (in case date changed)
        const newMonthKey = this.getMonthKeyFromDate(updatedExpense.date);
        if (!data.expenses[newMonthKey]) {
          data.expenses[newMonthKey] = [];
        }
        
        const updated = {
          ...updatedExpense,
          id: expenseId,
          amount: parseFloat(updatedExpense.amount)
        };
        
        data.expenses[newMonthKey].push(updated);
        data.expenses[newMonthKey].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        found = true;
      }
    });
    
    if (found) {
      this.saveData(data);
      return true;
    }
    return false;
  }

  // Delete an expense
  deleteExpense(expenseId) {
    const data = this.getData();
    let found = false;
    
    Object.keys(data.expenses).forEach(monthKey => {
      const expenseIndex = data.expenses[monthKey].findIndex(exp => exp.id === expenseId);
      if (expenseIndex !== -1) {
        data.expenses[monthKey].splice(expenseIndex, 1);
        found = true;
      }
    });
    
    if (found) {
      this.saveData(data);
      return true;
    }
    return false;
  }

  // Get monthly summary statistics
  getMonthlyStats(year, month) {
    const expenses = this.getExpensesByMonth(year, month);
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalTransactions = expenses.length;
    
    // Category breakdown
    const categoryBreakdown = {};
    expenses.forEach(expense => {
      if (!categoryBreakdown[expense.category]) {
        categoryBreakdown[expense.category] = { count: 0, amount: 0 };
      }
      categoryBreakdown[expense.category].count += 1;
      categoryBreakdown[expense.category].amount += expense.amount;
    });
    
    const uniqueCategories = Object.keys(categoryBreakdown).length;
    
    return {
      totalAmount,
      totalTransactions,
      uniqueCategories,
      categoryBreakdown,
      expenses
    };
  }

  // Get yearly summary
  getYearlyStats(year) {
    const data = this.getData();
    const yearlyData = {};
    
    for (let month = 1; month <= 12; month++) {
      const monthKey = this.getMonthKey(year, month);
      const monthStats = this.getMonthlyStats(year, month);
      yearlyData[month] = monthStats;
    }
    
    return yearlyData;
  }

  // Get recent months with data
  getRecentMonthsWithData(limit = 6) {
    const data = this.getData();
    const monthKeys = Object.keys(data.expenses)
      .filter(key => data.expenses[key].length > 0)
      .sort((a, b) => b.localeCompare(a)) // Sort descending (newest first)
      .slice(0, limit);
    
    return monthKeys.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const stats = this.getMonthlyStats(parseInt(year), parseInt(month));
      return {
        monthKey,
        year: parseInt(year),
        month: parseInt(month),
        ...stats
      };
    });
  }

  // Get category summary across all months
  getCategoryStats() {
    const allExpenses = this.getAllExpenses();
    const categoryStats = {};
    
    allExpenses.forEach(expense => {
      if (!categoryStats[expense.category]) {
        categoryStats[expense.category] = { count: 0, amount: 0 };
      }
      categoryStats[expense.category].count += 1;
      categoryStats[expense.category].amount += expense.amount;
    });
    
    // Sort by amount (highest first)
    const sortedCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.amount - a.amount);
    
    return sortedCategories;
  }

  // Get categories list
  getCategories() {
    const data = this.getData();
    return data.categories;
  }

  // Validate if a category is valid
  isValidCategory(category) {
    const validCategories = this.getCategories();
    return validCategories.includes(category);
  }

  // Clean up invalid categories from existing data
  cleanupInvalidCategories() {
    const data = this.getData();
    const validCategories = data.categories;
    let hasChanges = false;

    // Check all expenses across all months
    Object.keys(data.expenses).forEach(monthKey => {
      data.expenses[monthKey] = data.expenses[monthKey].map(expense => {
        if (!validCategories.includes(expense.category)) {
          console.warn(`Invalid category "${expense.category}" found in expense ${expense.id}, changing to "Other"`);
          hasChanges = true;
          return { ...expense, category: 'Other' };
        }
        return expense;
      });
    });

    if (hasChanges) {
      this.saveData(data);
      console.log('Invalid categories have been cleaned up and set to "Other"');
    }

    return hasChanges;
  }

  // Get a report of invalid categories (for debugging)
  getInvalidCategoriesReport() {
    const data = this.getData();
    const validCategories = data.categories;
    const invalidCategories = new Set();
    let totalInvalid = 0;

    Object.keys(data.expenses).forEach(monthKey => {
      data.expenses[monthKey].forEach(expense => {
        if (!validCategories.includes(expense.category)) {
          invalidCategories.add(expense.category);
          totalInvalid++;
        }
      });
    });

    return {
      invalidCategories: Array.from(invalidCategories),
      totalInvalidExpenses: totalInvalid,
      validCategories
    };
  }

  // Clear all data (for testing/reset)
  clearAllData() {
    localStorage.removeItem(this.storageKey);
    this.initializeStorage();
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
export default expenseService;
