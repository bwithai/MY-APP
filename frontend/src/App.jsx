import React, { useState } from 'react';
import '../src/logincss.css';
import fastapiLogo from './assets/fastapi-logo.svg';

const CardContainer = ({ children }) => {
  return <div className="card-container">{children}</div>;
};

const CustomInput = ({ label, type, value, onChange, showPasswordToggle, onTogglePassword, ...props }) => {
  return (
    <div className="input-container">
      <label>{label}</label>
      <div className="input-wrapper">
        <input type={type} value={value} onChange={onChange} {...props} />
        {showPasswordToggle && (
          <span className="input-icon" onClick={onTogglePassword}>
            {type === 'password' ? '👁️' : '🙈'}
          </span>
        )}
      </div>
    </div>
  );
};

const CustomButton = ({ children, onClick, type = 'button', variant = 'primary' }) => {
  return (
    <button type={type} onClick={onClick} className={`btn ${variant}`}>
      {children}
    </button>
  );
};

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      alert('Login Successful');
    } else {
      alert('Please fill in all fields.');
    }
  };

  return (
    <div className="login-container">
      <CardContainer>
        <img src={fastapiLogo} alt="FastAPI Logo" className="logo" />
        <form onSubmit={handleSubmit}>
          <CustomInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <CustomInput 
            label="Password" 
            type={showPassword ? 'text' : 'password'} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            showPasswordToggle={true}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          <CustomButton type="submit">Sign In</CustomButton>
        </form>
        <p>
          Don't have an account?{' '}
          <CustomButton variant="link" onClick={() => alert('Redirect to signup page')}>
            Sign Up
          </CustomButton>
        </p>
      </CardContainer>
    </div>
  );
};

export default LoginForm;
