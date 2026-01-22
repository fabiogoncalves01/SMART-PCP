
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  DoorOpen, 
  AlertCircle, 
  LogOut,
  Tags,
  Briefcase,
  BarChart3,
  BookOpen,
  Grid3X3,
  TrendingUp,
  CloudUpload,
  Sun,
  Moon,
  ShieldCheck,
  Building2,
  Settings as SettingsIcon
} from 'lucide-react';
import { Session, Instructor, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userProfile: UserProfile | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const SidebarItem: React.FC<{ to: string, icon: React.ReactNode, label: string, active: boolean }> = ({ to, icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-4 px-6 py-3 rounded-xl transition-all mb-1 relative group/item ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="font-bold text-[13px] whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 uppercase tracking-tight">
      {label}
    </span>
    {active && (
      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full group-hover/sidebar:block hidden" />
    )}
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children, userProfile, onLogout, isDarkMode, toggleDarkMode }) => {
  const location = useLocation();

  if (!userProfile) return <>{children}</>;

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <aside className="w-20 hover:w-72 bg-slate-900 text-white hidden md:flex flex-col fixed inset-y-0 left-0 z-[100] transition-all duration-300 ease-in-out group/sidebar overflow-hidden shadow-2xl border-r border-white/5">
        <div className="p-6 flex items-center gap-4 h-24 shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xs font-black shadow-xl shrink-0">PCP</div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            <h1 className="text-sm font-black tracking-tight uppercase leading-none">Smart PCP</h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Coordenação</p>
          </div>
        </div>

        <nav className="flex-1 px-2 mt-4 overflow-y-auto no-scrollbar overflow-x-hidden">
          <SidebarItem to="/dashboard" icon={<LayoutDashboard size={22} />} label="Dashboard" active={location.pathname === '/dashboard'} />
          <SidebarItem to="/importar" icon={<CloudUpload size={22} />} label="Importar CSV" active={location.pathname === '/importar'} />
          <SidebarItem to="/planejador" icon={<Grid3X3 size={22} />} label="Planejador" active={location.pathname === '/planejador'} />
          <SidebarItem to="/agenda" icon={<CalendarDays size={22} />} label="Agenda PCP" active={location.pathname === '/agenda'} />
          <SidebarItem to="/produtividade" icon={<TrendingUp size={22} />} label="Ocupação / Turno" active={location.pathname === '/produtividade'} />
          
          <div className="mt-8 mb-4 border-t border-white/5 mx-4" />
          <SidebarItem to="/cadastro-turma" icon={<BookOpen size={22} />} label="Nova Turma" active={location.pathname === '/cadastro-turma'} />
          <SidebarItem to="/instrutores-areas" icon={<Tags size={22} />} label="Áreas" active={location.pathname === '/instrutores-areas'} />
          <SidebarItem to="/ambientes" icon={<Building2 size={22} />} label="Gestão Ambientes" active={location.pathname === '/ambientes'} />
          <SidebarItem to="/contrato-capacidade" icon={<Briefcase size={22} />} label="Contratos" active={location.pathname === '/contrato-capacidade'} />
          <SidebarItem to="/pendencias" icon={<AlertCircle size={22} />} label="Pendências" active={location.pathname === '/pendencias'} />
          
          <div className="mt-8 mb-4 border-t border-white/5 mx-4" />
          <SidebarItem to="/ocupacao-instrutor" icon={<Users size={22} />} label="Ocupação Docente" active={location.pathname === '/ocupacao-instrutor'} />
          <SidebarItem to="/ocupacao-area" icon={<BarChart3 size={22} />} label="Ocupação Área" active={location.pathname === '/ocupacao-area'} />
          <SidebarItem to="/ocupacao-ambiente" icon={<DoorOpen size={22} />} label="Ambientes" active={location.pathname === '/ocupacao-ambiente'} />

          <div className="mt-8 mb-4 border-t border-white/5 mx-4" />
          <SidebarItem to="/auditoria" icon={<ShieldCheck size={22} />} label="Auditoria" active={location.pathname === '/auditoria'} />
          <SidebarItem to="/configuracoes" icon={<SettingsIcon size={22} />} label="Configurações" active={location.pathname === '/configuracoes'} />
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-900/50">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black shrink-0">
              CP
            </div>
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 overflow-hidden">
              <p className="text-xs font-black truncate uppercase tracking-tighter">Coordenação</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Acesso Pleno</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={20} className="shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-widest opacity-0 group-hover/sidebar:opacity-100 transition-opacity">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-20 flex flex-col min-w-0 transition-all duration-300">
        <header className={`h-20 border-b flex items-center justify-between px-10 sticky top-0 z-[60] transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-4 flex-1">
            <div className={`h-10 w-px mx-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Painel Operacional PCP</p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleDarkMode}
              className={`p-3 rounded-2xl transition-all shadow-lg active:scale-90 ${isDarkMode ? 'bg-indigo-600 text-white shadow-indigo-900/20' : 'bg-slate-100 text-slate-600 shadow-slate-200'}`}
              title={isDarkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 text-indigo-400 border border-white/10'}`}>
               COMPETÊNCIA 2026
            </div>
          </div>
        </header>

        <div className={`p-10 flex-1 overflow-auto transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50/30 text-slate-900'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
