
import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, ChevronRight, Loader2, KeyRound } from 'lucide-react';
import { UserProfile } from '../types';
import { Button } from '../components/UI';

interface LoginProps {
  onLogin: (profile: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    setTimeout(() => {
      if (password === 'Sen@i2026') {
        onLogin('COORDINATION');
      } else {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos visuais de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-3xl font-black shadow-[0_15px_40px_rgba(79,70,229,0.3)] mb-6">
            PCP
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
            Smart <span className="text-indigo-500">PCP</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-[9px] uppercase tracking-[0.4em]">Planning & Control Platform</p>
        </div>

        <div className={`bg-white rounded-[3rem] shadow-2xl p-10 border border-white/10 transition-all duration-300 ${error ? 'animate-shake' : ''}`}>
          <div className="mb-8 text-center">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Coordenação 2026</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Acesso Restrito ao Terminal</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-500' : 'text-slate-300 group-focus-within:text-indigo-500'}`}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha do Terminal"
                className={`w-full pl-14 pr-6 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-black outline-none transition-all placeholder:text-slate-200 ${
                  error ? 'border-rose-100 bg-rose-50 text-rose-600 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500 focus:bg-white'
                }`}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} className="text-rose-500 shrink-0" />
                <p className="text-[9px] font-black text-rose-800 uppercase">Chave de acesso incorreta</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-[10px] shadow-xl shadow-indigo-100 uppercase tracking-widest font-black"
              disabled={loading || !password}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Entrar no Sistema <ChevronRight size={16} /></>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-slate-300 text-[8px] font-black uppercase tracking-widest">
            <ShieldCheck size={14} />
            <span>Conexão Segura Ativa</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};
