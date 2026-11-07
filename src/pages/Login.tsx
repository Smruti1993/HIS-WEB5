import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  Monitor, 
  Heart, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Settings,
  Check
} from 'lucide-react';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

export const Login: React.FC = () => {
  const { login, loginDemo, isDbConnected, branches } = useData();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('medicore_remember_username');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (rememberMe) {
      localStorage.setItem('medicore_remember_username', username.trim());
    } else {
      localStorage.removeItem('medicore_remember_username');
    }

    setLoading(true);
    const success = await login(username, password);
    setLoading(false);

    if (success) {
      navigate('/');
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    navigate('/');
  };

  const handleForgotPasswordSuccess = (userReset: string, newPass: string) => {
    setUsername(userReset);
    setPassword(newPass);
  };

  const branchName = branches[0]?.name || 'MediCore HMS';

  return (
    <div className="min-h-screen w-full relative bg-[#020b1e] text-white flex flex-col justify-between overflow-x-hidden font-sans select-none">
      
      {/* High-Resolution Cinematic Medical Hero Background (Clean, No Text, No Forms) */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: "url('/medical-hero-bg.jpg')" }}
      />

      {/* Cybernetic Gradient Overlays for High-Contrast Text & Card Readability */}
      <div className="fixed inset-0 bg-gradient-to-r from-[#020b1e]/90 via-[#020b1e]/60 to-[#020b1e]/85 pointer-events-none z-0" />
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Content Grid */}
      <div className="relative z-10 w-full min-h-screen max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        
        {/* Left Hero Section: Branding, Showcase, Badges & Pulse */}
        <div className="w-full lg:w-7/12 flex flex-col justify-between self-stretch py-4 lg:py-6">
          
          {/* Top Logo & Title */}
          <div className="flex items-center gap-3.5 mb-8 lg:mb-12">
            <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-[2px] shadow-[0_0_25px_rgba(6,182,212,0.6)]">
              <div className="w-full h-full bg-[#030d22] rounded-[14px] flex items-center justify-center">
                <Activity className="w-7 h-7 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                {branchName}
              </h1>
              <p className="text-xs sm:text-sm text-cyan-200/90 font-medium tracking-wide">
                Next-Gen Healthcare Management
              </p>
            </div>
          </div>

          {/* Central Hero Headline & Tagline */}
          <div className="space-y-4 my-auto max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] drop-shadow-lg">
              Advanced Healthcare Management at Your Fingertips
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-lg">
              Empowering hospitals with smart solutions for better patient care and operational efficiency.
            </p>

            {/* 4 Feature Badges in a Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 pt-6">
              
              {/* Badge 1: Patient Care */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#071635]/85 border border-cyan-500/30 backdrop-blur-md hover:border-cyan-400 hover:bg-[#0c2456] transition-all duration-300 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-2 text-cyan-400 group-hover:scale-110 group-hover:text-cyan-300 transition-transform">
                  <Heart className="w-5 h-5 fill-cyan-400/20" />
                </div>
                <span className="text-xs font-semibold text-slate-200 tracking-wide">Patient Care</span>
              </div>

              {/* Badge 2: Operations */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#071635]/85 border border-cyan-500/30 backdrop-blur-md hover:border-cyan-400 hover:bg-[#0c2456] transition-all duration-300 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-2 text-cyan-400 group-hover:scale-110 group-hover:text-cyan-300 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200 tracking-wide">Operations</span>
              </div>

              {/* Badge 3: Analytics */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#071635]/85 border border-cyan-500/30 backdrop-blur-md hover:border-cyan-400 hover:bg-[#0c2456] transition-all duration-300 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-2 text-cyan-400 group-hover:scale-110 group-hover:text-cyan-300 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200 tracking-wide">Analytics</span>
              </div>

              {/* Badge 4: Growth */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#071635]/85 border border-cyan-500/30 backdrop-blur-md hover:border-cyan-400 hover:bg-[#0c2456] transition-all duration-300 group shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-2 text-cyan-400 group-hover:scale-110 group-hover:text-cyan-300 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200 tracking-wide">Growth</span>
              </div>

            </div>
          </div>

          {/* Bottom Heartbeat Line & Slogan */}
          <div className="flex items-center gap-3 pt-8 mt-auto text-cyan-300">
            <svg className="w-24 h-6 text-cyan-400 stroke-current" viewBox="0 0 100 24" fill="none">
              <path 
                d="M0 12h25l5-9 6 18 6-12 4 6 5-3h49" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <span className="text-xs sm:text-sm font-medium tracking-wide text-cyan-100">
              Together for a Healthier Tomorrow
            </span>
          </div>

        </div>

        {/* Right Hero Section: Glassmorphic Login Card */}
        <div className="w-full lg:w-5/12 max-w-[430px] flex justify-center lg:justify-end">
          <div className="w-full bg-[#071329]/90 border border-cyan-500/30 rounded-[2rem] p-7 sm:p-9 backdrop-blur-2xl shadow-[0_0_60px_rgba(4,163,255,0.22)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            
            {/* Ambient Card Highlights */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-600/15 rounded-full blur-2xl pointer-events-none"></div>

            {/* Card Header */}
            <div className="mb-7 text-center">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1.5">
                Welcome Back!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Please sign in to continue
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-400 group-focus-within:text-cyan-300 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#0a1b38] border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 focus:bg-[#0c2247] outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-400 group-focus-within:text-cyan-300 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 bg-[#0a1b38] border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 focus:bg-[#0c2247] outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                  <div 
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      rememberMe 
                        ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_8px_rgba(6,182,212,0.6)]' 
                        : 'border-slate-600 bg-slate-900/60'
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:via-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 text-sm tracking-wide transition-all duration-200 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4 ml-0.5" />
                    </>
                  )}
                </button>
              </div>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-700/80 w-full"></div>
                <span className="bg-[#071329] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
                  OR
                </span>
              </div>

              {/* Demo Mode Button */}
              <div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-3 bg-white/5 hover:bg-cyan-500/10 border border-cyan-500/40 hover:border-cyan-400 text-slate-200 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide cursor-pointer"
                >
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  Demo Mode (No DB)
                </button>
              </div>
            </form>

            {/* Footer Information */}
            <div className="mt-7 pt-4 border-t border-slate-800 text-center space-y-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <span>MediCore HMS v2.0.0</span>
                <span>•</span>
                <a href="mailto:it@medicore.com" className="text-cyan-400 hover:underline">
                  Support: it@medicore.com
                </a>
              </div>

              {/* DB Configure Shortcut */}
              <div className="pt-0.5 flex items-center justify-center gap-2 text-[10px] text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                <span>{isDbConnected ? 'Database Connected' : 'Local / Offline DB Mode'}</span>
                <button
                  type="button"
                  onClick={() => navigate('/connection')}
                  className="ml-1 text-slate-400 hover:text-cyan-400 flex items-center gap-0.5 cursor-pointer"
                  title="Configure Database Connection"
                >
                  <Settings className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={handleForgotPasswordSuccess}
        defaultUsername={username}
      />
    </div>
  );
};
