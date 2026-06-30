import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, User, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, register, error: authError, clearError } = useAuth();

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setValidationError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setValidationError('Username must be between 3 and 20 characters long.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      if (isLogin) {
        await login(trimmedUsername, password);
      } else {
        await register(trimmedUsername, password);
      }
      
      // Dynamic import of canvas-confetti for celebrating login success
      import('canvas-confetti').then((confettiModule) => {
        confettiModule.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      });
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'var(--primary-gradient)',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
          }}>
            <MessageSquare size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.025em', background: 'linear-gradient(to right, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AetherChat
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {isLogin ? 'Enter the conversation' : 'Create your secure account'}
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.2)', padding: '4px', borderRadius: '10px', marginBottom: '24px' }}>
          <button 
            onClick={() => !isLogin && handleToggle()}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: isLogin ? 'var(--primary-gradient)' : 'transparent',
              color: isLogin ? 'white' : 'var(--text-secondary)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Log In
          </button>
          <button 
            onClick={() => isLogin && handleToggle()}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: !isLogin ? 'var(--primary-gradient)' : 'transparent',
              color: !isLogin ? 'white' : 'var(--text-secondary)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notifications */}
        {(validationError || authError) && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            color: '#fda4af',
            fontSize: '0.85rem'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{validationError || authError}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className="glass-input"
                style={{ width: '100%', paddingLeft: '44px' }}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="••••••" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className="glass-input"
                style={{ width: '100%', paddingLeft: '44px' }}
                required
                disabled={submitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="••••••" 
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '44px' }}
                  required
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="glass-btn" 
            style={{ width: '100%', padding: '14px', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};
