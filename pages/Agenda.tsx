
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Users, Calendar as CalendarIcon, 
  Search, Sun, Moon, Sunrise, 
  MapPin, Clock, LayoutGrid, List, Filter, AlertTriangle
} from 'lucide-react';
import { Badge, Button, StatusChip } from '../components/UI';
import { Status, Turno, Session, Instructor, InstructorActivity, Area } from '../types';

type ViewMode = 'day' | 'week' | 'list';

interface AgendaProps {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  instructors: Instructor[];
  activities?: InstructorActivity[];
}

const slugify = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]/g, "")
     .trim();

export const Agenda: React.FC<AgendaProps> = ({ sessions, setSessions, instructors, activities = [] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<Area | 'TODOS'>('TODOS');
  const [isNavigating, setIsNavigating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingInternal = useRef(false);

  useEffect(() => {
    if (sessions.length > 0) {
      const firstDateStr = sessions[0].data;
      if (firstDateStr) {
        const targetDate = new Date(firstDateStr + 'T12:00:00');
        if (!isNaN(targetDate.getTime())) {
          setCurrentDate(targetDate);
        }
      }
    }
  }, [sessions]);

  const getISODate = (d: Date) => d.toISOString().split('T')[0];

  const isMatchInstructor = (inst: Instructor, session: Session) => {
    if (session.instrutorId === inst.id) return true;
    if (!session.instrutor) return false;
    return slugify(session.instrutor) === slugify(inst.nome);
  };

  const weekDays = useMemo(() => {
    const days = [];
    const base = new Date(currentDate);
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(base.setDate(diff));

    // Geramos um range maior para permitir o scroll suave lateral
    for (let i = -14; i < 21; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      if (d.getDay() !== 0) days.push(d);
    }
    return days;
  }, [currentDate]);

  // Identificador da semana para disparar animações
  const weekKey = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(startOfWeek.setDate(diff)).toISOString().split('T')[0];
  }, [currentDate]);

  const handleScroll = () => {
    if (!scrollContainerRef.current || isScrollingInternal.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 220;
    const index = Math.round(scrollLeft / itemWidth);
    if (weekDays[index]) {
      const newDate = weekDays[index];
      if (getISODate(newDate) !== getISODate(currentDate)) {
        setCurrentDate(new Date(newDate));
      }
    }
  };

  const navigateDate = (dir: 'prev' | 'next') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const itemWidth = 220;
    // Navega 5 dias por vez (uma semana útil completa)
    const move = dir === 'next' ? itemWidth * 5 : -itemWidth * 5;
    
    setIsNavigating(true);
    isScrollingInternal.current = true;
    
    container.scrollBy({ left: move, behavior: 'smooth' });
    
    // Pequeno delay para a animação de opacidade coincidir com o scroll
    setTimeout(() => {
      isScrollingInternal.current = false;
      setIsNavigating(false);
    }, 600);
  };

  const getTurnoConfig = (turno: Turno) => {
    switch (turno) {
      case Turno.MANHA: return { icon: <Sunrise size={10} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case Turno.TARDE: return { icon: <Sun size={10} />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case Turno.NOITE: return { icon: <Moon size={10} />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      default: return { icon: <Clock size={10} />, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  const filteredInstructors = useMemo(() => {
    return instructors.filter(i => {
      if (i.status === 'Inativo') return false;
      const matchesSearch = i.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           i.area.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = selectedArea === 'TODOS' || i.area === selectedArea;
      return matchesSearch && matchesArea;
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [instructors, searchTerm, selectedArea]);

  const SessionCard: React.FC<{ s: Session }> = ({ s }) => {
    const cfg = getTurnoConfig(s.turno);
    const hasError = s.status === Status.CONFLITO || s.status === Status.MULTI_TURMA || s.status === Status.UNMAPPED_SHIFT;
    return (
      <div className={`group relative p-4 rounded-[1.5rem] bg-white border transition-all duration-300 animate-in fade-in zoom-in-95 ${
        hasError ? 'border-rose-200 shadow-rose-100 shadow-lg ring-2 ring-rose-50' : 'border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200'
      }`}>
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${hasError ? 'bg-rose-500' : 'bg-indigo-400'}`} />
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} text-[8px] font-black uppercase tracking-wider`}>
            {cfg.icon} {s.turno}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
             <Clock size={10} className="text-slate-400" />
             <span className="text-[9px] font-black text-slate-700">{s.inicio}</span>
          </div>
        </div>
        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-tight mb-1 truncate">{s.turmas[0]}</h4>
        <p className="text-[9px] font-bold text-slate-400 uppercase leading-snug line-clamp-1 mb-3">{s.unidadeCurricular}</p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-auto">
          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
            <MapPin size={10} className="text-indigo-400" />
            <span className="truncate max-w-[60px]">{s.ambiente || 'S/ AMB'}</span>
          </div>
          <StatusChip status={s.status} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-40">
      <div className="flex flex-wrap items-center gap-6 animate-in fade-in duration-1000">
        <div className="bg-slate-100/50 p-2 rounded-full border border-slate-200 flex items-center shadow-sm">
          <button onClick={() => setViewMode('week')} className={`flex items-center gap-3 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
            <LayoutGrid size={16} /> Semana
          </button>
          <button onClick={() => setViewMode('list')} className={`flex items-center gap-3 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
            <List size={16} /> Lista
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateDate('prev')} 
            className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-90 hover:text-indigo-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="bg-white border-2 border-slate-100 rounded-[1.8rem] px-8 py-3 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-all cursor-pointer relative group">
             <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600">{currentDate.toLocaleDateString('pt-BR')}</span>
             <CalendarIcon size={18} className="text-indigo-500" />
             <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={getISODate(currentDate)} onChange={(e) => setCurrentDate(new Date(e.target.value + 'T12:00:00'))} />
          </div>
          <button 
            onClick={() => navigateDate('next')} 
            className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-90 hover:text-indigo-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="relative flex-1 min-w-[300px]">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input type="text" placeholder="Filtrar base de docentes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-[1.8rem] pl-14 pr-8 py-3 text-sm font-black uppercase outline-none focus:border-indigo-400 transition-all shadow-sm" />
        </div>
      </div>

      <div className={`relative bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-opacity duration-500 ${isNavigating ? 'opacity-40' : 'opacity-100'}`}>
        <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
          <table className="w-full text-left border-separate border-spacing-0 table-fixed">
            <thead className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40">
              <tr>
                <th className="w-[280px] px-10 py-12 sticky left-0 bg-white dark:bg-slate-900 z-50 border-r border-slate-100 dark:border-slate-800 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200"><Users size={22} /></div>
                    <div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] block mb-1">Docentes</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Base Cadastral</span>
                    </div>
                  </div>
                </th>
                {weekDays.map((date, idx) => (
                  <th key={idx} className="w-[220px] px-6 py-12 border-r border-slate-100 dark:border-slate-800 text-center align-middle snap-start">
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-4 ${getISODate(date) === getISODate(new Date()) ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                       <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 ${getISODate(date) === getISODate(new Date()) ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'}`}>
                         <span className="text-2xl font-black tracking-tighter">{date.getDate()}</span>
                       </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody 
              key={weekKey} 
              className="divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-right-4 duration-700 ease-out"
            >
              {filteredInstructors.map((inst, rowIdx) => (
                <tr 
                  key={inst.id} 
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all"
                  style={{ animationDelay: `${rowIdx * 30}ms` }}
                >
                  <td className="px-10 py-10 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-white/95 dark:group-hover:bg-slate-900 z-20 border-r border-slate-100 dark:border-slate-800 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-sm bg-indigo-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {inst.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none mb-1.5 truncate group-hover:text-indigo-600 transition-colors">
                          {inst.nome}
                        </p>
                        <Badge color="slate" className="scale-75 origin-left opacity-60">{inst.area}</Badge>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((date, idx) => {
                    const daySessions = sessions.filter(s => s.data === getISODate(date) && isMatchInstructor(inst, s));
                    return (
                      <td key={idx} className="p-4 border-r border-slate-50 dark:border-slate-800 align-top snap-start transition-colors duration-300">
                        <div className="min-h-[160px] flex flex-col gap-4">
                          {daySessions.map(s => <SessionCard key={s.id} s={s} />)}
                          {daySessions.length === 0 && (
                            <div className="flex-1 rounded-[1.5rem] border-2 border-dashed border-slate-50 dark:border-slate-800 group-hover:border-indigo-100 transition-colors duration-500" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};
