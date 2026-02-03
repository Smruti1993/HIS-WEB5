import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, Loader2, HeartPulse, Settings } from 'lucide-react';

export const Login = () => {
  const { login, isDbConnected } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - Hero / Branding */}
        <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30 shadow-lg">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">MediCore HMS</h1>
            <p className="text-blue-100 text-lg">Next-Gen Healthcare Management System</p>
          </div>

          <div className="relative z-10 space-y-6">
            <p className="text-blue-100/80 leading-relaxed max-w-sm">
              Streamline your hospital operations with our comprehensive, AI-powered platform. Designed for efficiency, built for care.
            </p>
            <div className="flex gap-2">
                <div className="h-1.5 w-8 bg-white rounded-full opacity-100"></div>
                <div className="h-1.5 w-8 bg-white rounded-full opacity-40"></div>
                <div className="h-1.5 w-8 bg-white rounded-full opacity-40"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white relative">
          {!isDbConnected && (
              <div className="absolute top-6 right-6">
                  <button 
                    onClick={() => navigate('/connection')} 
                    className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                  >
                      <Settings className="w-3 h-3" /> Connect DB
                  </button>
              </div>
          )}

          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
              <p className="text-slate-500">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="text-right mt-2">
                    <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot password?</a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                    By accessing this system, you agree to comply with all hospital data privacy policies and HIPAA regulations.
                </p>
                <div className="mt-4 text-xs text-slate-400 flex justify-center gap-4">
                    <span>v2.4.0</span>
                    <span>•</span>
                    <span>Support: it@medicore.com</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};