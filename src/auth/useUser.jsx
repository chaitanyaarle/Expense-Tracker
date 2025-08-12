import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Currency mapping object
const CURRENCY_SYMBOLS = {
  'USD': '$',     // US Dollar
  'EUR': '€',     // Euro
  'GBP': '£',     // British Pound
  'JPY': '¥',     // Japanese Yen
  'INR': '₹',     // Indian Rupee
  'CNY': '¥',     // Chinese Yuan
  'CAD': 'C$',    // Canadian Dollar
  'AUD': 'A$',    // Australian Dollar
  'CHF': 'CHF',   // Swiss Franc
  'SEK': 'kr',    // Swedish Krona
  'NOK': 'kr',    // Norwegian Krone
  'DKK': 'kr',    // Danish Krone
  'PLN': 'zł',    // Polish Złoty
  'CZK': 'Kč',    // Czech Koruna
  'HUF': 'Ft',    // Hungarian Forint
  'RUB': '₽',     // Russian Ruble
  'BRL': 'R$',    // Brazilian Real
  'KRW': '₩',     // South Korean Won
  'SGD': 'S$',    // Singapore Dollar
  'HKD': 'HK$',   // Hong Kong Dollar
  'MXN': '$',     // Mexican Peso
  'ZAR': 'R',     // South African Rand
  'TRY': '₺',     // Turkish Lira
  'ILS': '₪',     // Israeli Shekel
  'AED': 'د.إ',   // UAE Dirham
  'SAR': '﷼',     // Saudi Riyal
  'THB': '฿',     // Thai Baht
  'MYR': 'RM',    // Malaysian Ringgit
  'IDR': 'Rp',    // Indonesian Rupiah
  'PHP': '₱',     // Philippine Peso
  'VND': '₫',     // Vietnamese Dong
  'EGP': 'E£',    // Egyptian Pound
  'NGN': '₦',     // Nigerian Naira
  'KES': 'KSh',   // Kenyan Shilling
  'GHS': '₵',     // Ghanaian Cedi
  'XOF': 'CFA',   // West African CFA Franc
  'MAD': 'DH',    // Moroccan Dirham
  'ETB': 'Br',    // Ethiopian Birr
  'UGX': 'USh',   // Ugandan Shilling
  'TZS': 'TSh',   // Tanzanian Shilling
  'RWF': 'FRw',   // Rwandan Franc
  'ZMW': 'ZK',    // Zambian Kwacha
  'BWP': 'P',     // Botswana Pula
  'NAD': 'N$',    // Namibian Dollar
  'SZL': 'L',     // Swazi Lilangeni
  'LSL': 'L',     // Lesotho Loti
  'MWK': 'MK',    // Malawian Kwacha
  'ZWL': 'Z$'     // Zimbabwean Dollar
};

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  return CURRENCY_SYMBOLS[currencyCode?.toUpperCase()] || currencyCode || '₹';
};

// User Context
const UserContext = createContext();

// Action types
const USER_ACTIONS = {
  SET_USER: 'SET_USER',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT'
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// User reducer
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      };
    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case USER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case USER_ACTIONS.LOGOUT:
      return {
        ...initialState
      };
    default:
      return state;
  }
};

// UserProvider component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('expenseTracker_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          dispatch({ type: USER_ACTIONS.SET_USER, payload: user });
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('expenseTracker_user');
      }
    };

    loadUser();
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('expenseTracker_user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('expenseTracker_user');
    }
  }, [state.user]);

  // Helper function to get all registered users from localStorage
  const getRegisteredUsers = () => {
    try {
      const users = localStorage.getItem('expenseTracker_registeredUsers');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error reading registered users:', error);
      return [];
    }
  };

  // Helper function to save registered users to localStorage
  const saveRegisteredUsers = (users) => {
    try {
      localStorage.setItem('expenseTracker_registeredUsers', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving registered users:', error);
    }
  };

  // Login function
  const login = async (credentials) => {
    dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get registered users from localStorage
      const registeredUsers = getRegisteredUsers();
      
      // Find user with matching email
      const user = registeredUsers.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
      
      if (!user) {
        const errorMessage = 'No account found with this email. Please register first.';
        dispatch({ type: USER_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage, shouldRegister: true };
      }
      
      // Validate password (in real app, this would be hashed)
      if (user.password !== credentials.password) {
        const errorMessage = 'Invalid password. Please try again.';
        dispatch({ type: USER_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
      
      // Remove password from user data before setting state
      const { password, ...userWithoutPassword } = user;
      
      // Ensure currency symbol is present (for backward compatibility)
      if (!userWithoutPassword.preferences?.currencySymbol) {
        userWithoutPassword.preferences = {
          ...userWithoutPassword.preferences,
          currencySymbol: getCurrencySymbol(userWithoutPassword.preferences?.currency)
        };
      }
      
      dispatch({ type: USER_ACTIONS.SET_USER, payload: userWithoutPassword });
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.';
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get existing registered users
      const registeredUsers = getRegisteredUsers();
      
      // Check if user already exists
      const existingUser = registeredUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      
      if (existingUser) {
        const errorMessage = 'An account with this email already exists. Please login instead.';
        dispatch({ type: USER_ACTIONS.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage, shouldLogin: true };
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: userData.email.toLowerCase(),
        name: userData.name,
        password: userData.password, // In real app, this would be hashed
        profilePicture: null,
        preferences: {
          currency: userData.currency || 'INR',
          currencySymbol: getCurrencySymbol(userData.currency || 'INR'),
          theme: 'light'
        },
        createdAt: new Date().toISOString()
      };
      
      // Add to registered users
      const updatedUsers = [...registeredUsers, newUser];
      saveRegisteredUsers(updatedUsers);
      
      // Remove password from user data before setting state
      const { password, ...userWithoutPassword } = newUser;
      
      dispatch({ type: USER_ACTIONS.SET_USER, payload: userWithoutPassword });
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Update user function
  const updateUser = async (updates) => {
    dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
    
    try {
      // Simulate API call - replace with actual update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If currency is being updated, also update the currency symbol
      if (updates.preferences?.currency) {
        updates.preferences.currencySymbol = getCurrencySymbol(updates.preferences.currency);
      }
      
      dispatch({ type: USER_ACTIONS.UPDATE_USER, payload: updates });
      return { success: true };
    } catch (error) {
      const errorMessage = 'Failed to update user. Please try again.';
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: USER_ACTIONS.LOGOUT });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: USER_ACTIONS.SET_ERROR, payload: null });
  };

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    updateUser,
    logout,
    clearError,
    
    // Utilities
    getCurrencySymbol,
    currencySymbols: CURRENCY_SYMBOLS
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
