// pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserCog, Users, UserCircle, Mail, Lock, User, 
  ArrowLeft, Eye, EyeOff, Check, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength) {
      case 0: return 'bg-gray-600';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-600';
    }
  };

  const getPasswordStrengthText = () => {
    switch(passwordStrength) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      case 5: return 'Very Strong';
      default: return 'Enter password';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      if (success) {
        toast.success('Registration successful! Please login with your credentials.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'admin', icon: UserCog, label: 'Admin', color: 'purple' },
    { id: 'manager', icon: Users, label: 'Manager', color: 'blue' },
    { id: 'cashier', icon: UserCircle, label: 'Cashier', color: 'green' }
  ];

  const getRoleColors = (role, isSelected) => {
    const colors = {
      admin: {
        bg: isSelected ? 'bg-purple-500/20' : 'bg-white/5',
        border: isSelected ? 'border-purple-500/50' : 'border-white/10',
        text: isSelected ? 'text-purple-300' : 'text-gray-400',
        hover: 'hover:bg-white/10'
      },
      manager: {
        bg: isSelected ? 'bg-blue-500/20' : 'bg-white/5',
        border: isSelected ? 'border-blue-500/50' : 'border-white/10',
        text: isSelected ? 'text-blue-300' : 'text-gray-400',
        hover: 'hover:bg-white/10'
      },
      cashier: {
        bg: isSelected ? 'bg-green-500/20' : 'bg-white/5',
        border: isSelected ? 'border-green-500/50' : 'border-white/10',
        text: isSelected ? 'text-green-300' : 'text-gray-400',
        hover: 'hover:bg-white/10'
      }
    };
    return colors[role] || colors.cashier;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <img 
            src="/LOGO_CXP Motozone-02.png" 
            alt="CXP Motozone Logo" 
            className="h-24 w-auto object-contain"
          />
        </div>
        
        <h3 className="mt-2 text-center text-xl text-gray-400">
          Create your account
        </h3>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl shadow-xl border border-white/10 p-8">
          
          {/* Role Selection Info */}
          <div className="mb-6 backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <UserCircle className="h-5 w-5 text-indigo-400" />
              <p className="text-sm font-medium text-gray-300">Select User Role</p>
            </div>
            <p className="text-xs text-gray-500">
              Choose the appropriate role that determines access permissions in the system
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.id;
                  const colors = getRoleColors(role.id, isSelected);
                  
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({...formData, role: role.id})}
                      disabled={loading}
                      className={`
                        flex flex-col items-center p-3 rounded-lg border transition-colors
                        ${colors.bg} ${colors.border} ${colors.hover}
                      `}
                    >
                      <Icon className={`h-6 w-6 mb-1 ${colors.text}`} />
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {role.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Role Display */}
            <div className={`
              p-4 rounded-lg border
              ${formData.role === 'admin' ? 'bg-purple-500/10 border-purple-500/30' : ''}
              ${formData.role === 'manager' ? 'bg-blue-500/10 border-blue-500/30' : ''}
              ${formData.role === 'cashier' ? 'bg-green-500/10 border-green-500/30' : ''}
            `}>
              <div className="flex items-center mb-2">
                {formData.role === 'admin' && <UserCog className="h-5 w-5 text-purple-400 mr-2" />}
                {formData.role === 'manager' && <Users className="h-5 w-5 text-blue-400 mr-2" />}
                {formData.role === 'cashier' && <UserCircle className="h-5 w-5 text-green-400 mr-2" />}
                <span className="text-sm font-medium text-gray-300">
                  Selected Role: <span className="font-semibold capitalize text-white">{formData.role}</span>
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {formData.role === 'admin' && 'Full system access • Manage users • Configure settings • View all reports'}
                {formData.role === 'manager' && 'Manage inventory • View reports • Oversee operations • Process approvals'}
                {formData.role === 'cashier' && 'Process sales • Manage transactions • View daily sales • Basic operations'}
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                  placeholder="Create a password (min. 6 characters)"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Password Strength:</span>
                    <span className={`text-xs font-medium text-${getPasswordStrengthColor().replace('bg-', '')}-400`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getPasswordStrengthColor()} transition-all`}
                      style={{width: `${(passwordStrength / 5) * 100}%`}}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password Match Indicator */}
            {formData.password && formData.confirmPassword && (
              <div className={`
                p-3 rounded-lg border
                ${formData.password === formData.confirmPassword 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
                }
              `}>
                <div className="flex items-center">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-400" />
                      <span className="text-sm text-green-300">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2 text-red-400" />
                      <span className="text-sm text-red-300">Passwords do not match</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-500">Already have an account?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Sign in to existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;