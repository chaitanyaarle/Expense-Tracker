import { useState } from 'react';
import { useUser } from './useUser';
import './auth.css';

const Auth = () => {
  const { login, register, isLoading, error, clearError } = useUser();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'INR'
  });

  const currencySymbols = ['₹', '$', '€', '£', '¥', '₿', '₽', '₩'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedStep1 = formData.name.trim().length >= 2 && formData.email.includes('@');
  const canProceedStep2 = formData.password.length >= 6 && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Only handle actual submission for login mode or final step of registration
    if (isLoginMode || (!isLoginMode && currentStep === 3)) {
      if (!isLoginMode) {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          return;
        }
        if (formData.password.length < 6) {
          return;
        }
      }

      const credentials = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        currency: formData.currency
      };

      const result = isLoginMode 
        ? await login(credentials)
        : await register(credentials);

      if (result.success) {
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          currency: 'INR'
        });
        setCurrentStep(1);
      } else {
        // Handle specific error cases
        if (result.shouldRegister && isLoginMode) {
          // User not found during login, switch to registration
          setIsLoginMode(false);
          setCurrentStep(1);
          // Keep the email they entered
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));
        } else if (result.shouldLogin && !isLoginMode) {
          // User already exists during registration, switch to login
          setIsLoginMode(true);
          setCurrentStep(1);
          // Keep the email they entered
          setFormData(prev => ({
            name: '',
            password: '',
            confirmPassword: '',
            currency: 'INR'
          }));
        }
      }
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setCurrentStep(1);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      currency: 'INR'
    });
    clearError();
  };

  const renderStepIndicator = () => {
    if (isLoginMode) return null;
    
    return (
      <div className="step-indicator">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`step ${
              step < currentStep ? 'completed' : 
              step === currentStep ? 'active' : ''
            }`}
          />
        ))}
      </div>
    );
  };

  const renderLoginForm = () => (
    <>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          placeholder="Enter your email"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          placeholder="Enter your password"
          disabled={isLoading}
          minLength={6}
        />
      </div>
    </>
  );

  const renderRegistrationStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <span className="error-text">Passwords do not match</span>
              )}
            </div>
          </>
        );

      case 3:
        return (
          <div className="form-group">
            <label htmlFor="currency">Preferred Currency</label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CNY">CNY (¥)</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (isLoginMode) {
      return (
        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'Please wait...' : 'Sign In'}
        </button>
      );
    }

    // Registration buttons
    if (currentStep === 1) {
      return (
        <button 
          type="button" 
          className="auth-button"
          disabled={!canProceedStep1 || isLoading}
          onClick={nextStep}
        >
          Next Step
        </button>
      );
    }

    if (currentStep === 2) {
      return (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            className="auth-button secondary"
            onClick={prevStep}
            disabled={isLoading}
          >
            Back
          </button>
          <button 
            type="button" 
            className="auth-button"
            disabled={!canProceedStep2 || isLoading}
            onClick={nextStep}
          >
            Next Step
          </button>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            className="auth-button secondary"
            onClick={prevStep}
            disabled={isLoading}
          >
            Back
          </button>
          <button 
            type="button" 
            className="auth-button"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      );
    }
  };

  return (
    <div className="auth-container">
      {/* Currency symbols section */}
      <div className="currency-symbols">
        <div className="main-currency">₹</div>
        {currencySymbols.slice(1).map((symbol, index) => (
          <div
            key={index}
            className="floating-currency"
            style={{
              animationDelay: `${index * 0.5}s`,
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      {/* Auth form section */}
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Expense Tracker</h1>
            <h2>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
            <p>
              {isLoginMode 
                ? 'Sign in to manage your expenses' 
                : `Step ${currentStep} of 3 - Let's get you started`
              }
            </p>
          </div>

          {renderStepIndicator()}

          <form onSubmit={handleSubmit} className="auth-form">
            {isLoginMode ? renderLoginForm() : renderRegistrationStep()}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {renderActionButtons()}
          </form>

          <div className="auth-footer">
            <p>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="link-button"
                onClick={toggleMode}
                disabled={isLoading}
              >
                {isLoginMode ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;