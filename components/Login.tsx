
import React, { useState } from 'react';
import { auth } from '../services/storageService';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight, Zap } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick login credentials provided by user
  const demoEmail = "rfnsyhmi@google-edu.com";
  const demoPass = "Arfan.2009@";

  const handleQuickLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await auth.signIn(demoEmail, demoPass);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Quick login failed. Please try manual login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = isLogin 
        ? await auth.signIn(email, password)
        : await auth.signUp(email, password);
      
      if (error) throw error;
      if (!isLogin) alert("Account created! You can now sign in.");
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl text-white shadow-2xl mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">WealthSense</h1>
          <p className="text-slate-500 font-medium mt-2">Secure your financial vault</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-slide-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">{isLogin ? 'Sign In' : 'Create Account'}</h2>
            {isLogin && (
              <button 
                onClick={handleQuickLogin}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <Zap className="w-3 h-3" />
                <span>Quick Login</span>
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center space-x-3 hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>{isLogin ? 'Enter Vault' : 'Register Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
          Powered by Supabase Secure Cloud Engine
        </p>
      </div>
    </div>
  );
};

export default Login;
