
import React from 'react';
import { Status } from '../types';
import { AlertTriangle, CheckCircle2, Clock, Users } from 'lucide-react';

export const Card: React.FC<{ title?: string, children: React.ReactNode, className?: string, onClick?: () => void }> = ({ title, children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 ${className}`}
  >
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const Button: React.FC<{ 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline', 
  children: React.ReactNode, 
  onClick?: () => void,
  className?: string,
  disabled?: boolean,
  size?: 'sm' | 'md',
  type?: 'button' | 'submit' | 'reset'
}> = ({ variant = 'primary', children, onClick, className = '', disabled, size = 'md', type = 'button' }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95',
    danger: 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white border border-rose-100 dark:border-rose-900/30 active:scale-95',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95',
    outline: 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-600 hover:text-indigo-600 active:scale-95'
  };
  const sizes = { sm: 'px-4 py-2 text-[10px] font-black', md: 'px-5 py-2.5 text-xs font-black' };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode, color?: string, className?: string }> = ({ children, color = 'slate', className = '' }) => {
  const colors: any = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest flex items-center gap-1 ${colors[color] || colors.slate} ${className}`}>
      {children}
    </span>
  );
};

export const StatusChip: React.FC<{ status: Status, description?: string }> = ({ status, description }) => {
  const config = {
    [Status.OK]: { color: 'emerald', label: 'Validado', icon: <CheckCircle2 size={10} /> },
    [Status.PENDENTE]: { color: 'amber', label: 'Pendente', icon: <Clock size={10} /> },
    [Status.CONFLITO]: { color: 'rose', label: 'Conflito', icon: <AlertTriangle size={10} className="animate-pulse" /> },
    [Status.MULTI_TURMA]: { color: 'indigo', label: 'Multi-Turma', icon: <Users size={10} /> },
    [Status.UNMAPPED_SHIFT]: { color: 'slate', label: 'Turno N/M', icon: <Clock size={10} /> },
  };

  return (
    <div className="relative group/status flex items-center">
      <Badge color={config[status].color}>
        {config[status].icon}
        {config[status].label}
      </Badge>
    </div>
  );
};
