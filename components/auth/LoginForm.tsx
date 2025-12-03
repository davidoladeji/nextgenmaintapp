'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/store';
import { LoginData, CreateUserData } from '@/lib/auth';

interface FormData extends LoginData {
  name?: string;
  confirmPassword?: string;
}

export default function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, setLoading, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>();

  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      if (isRegister) {
        // Register new user
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            name: data.name,
            password: data.password,
          }),
        });

        const registerResult = await registerResponse.json();

        if (!registerResult.success) {
          throw new Error(registerResult.error || 'Registration failed');
        }

        toast.success('Account created successfully!');

        // Auto-login after registration
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });

        const loginResult = await loginResponse.json();

        if (!loginResult.success) {
          throw new Error(loginResult.error || 'Auto-login failed');
        }

        login(loginResult.data.user, loginResult.data.token);

        // Set onboarding flag to redirect to wizard
        localStorage.setItem('needs-onboarding', 'true');

        toast.success('Welcome to NextGenMaint!');
      } else {
        // Login existing user
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Login failed');
        }

        login(result.data.user, result.data.token);
        toast.success(`Welcome back, ${result.data.user.name}!`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    reset();
  };

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mt-2">
          {isRegister
            ? 'Start your reliability engineering journey'
            : 'Please sign in to continue'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter your full name"
              {...register('name', {
                required: isRegister ? 'Name is required' : false,
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />
            {errors.name && (
              <p className="text-danger-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            className="input"
            placeholder="Enter your email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Please enter a valid email',
              },
            })}
          />
          {errors.email && (
            <p className="text-danger-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-danger-600 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {isRegister && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input"
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: isRegister ? 'Please confirm your password' : false,
                validate: (value) =>
                  !isRegister || value === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="text-danger-600 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary btn-md w-full"
        >
          {isLoading ? (
            <div className="spinner mr-2" />
          ) : isRegister ? (
            <UserPlus className="w-4 h-4 mr-2" />
          ) : (
            <LogIn className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-slate-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>

      {!isRegister && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">Demo Credentials:</p>

          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded p-2 border border-purple-200 dark:border-purple-700/30">
            <p className="text-[10px] font-medium text-purple-600 dark:text-purple-400 mb-0.5">SUPERADMIN</p>
            <p className="text-[11px] text-gray-800 dark:text-slate-300 font-mono">
              superadmin@nextgenmaint.com / super123
            </p>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded p-2 border border-green-500/20 dark:border-green-700/30">
            <p className="text-[10px] font-medium text-green-700 dark:text-green-400 mb-0.5">ORG ADMIN (OgenticAI)</p>
            <p className="text-[11px] text-gray-800 dark:text-slate-300 font-mono">
              admin@fmea.local / admin123
            </p>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded p-2 border border-teal-200 dark:border-teal-700/30">
            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400 mb-0.5">ORG ADMIN (Demo Corp)</p>
            <p className="text-[11px] text-gray-800 dark:text-slate-300 font-mono">
              john@democorp.com / demo123
            </p>
          </div>
        </div>
      )}
    </div>
  );
}