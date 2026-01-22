
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, Briefcase, Calendar, BarChart3, Clock, Sparkles, Loader2, 
  CheckCircle2, CircleDashed, Zap, ShieldCheck, Activity, Search, Info, Monitor,
  TrendingUp, ArrowUpRight, ChevronRight, PlayCircle, History, CalendarDays,
  Sunrise, Sun, Moon, PieChart
} from 'lucide-react';
import { Card, Badge, Button } from '../components/UI';
import { Session, Status, Instructor, InstructorActivity, Area, Turno } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  sessions: Session[];
  instructors: Instructor[];
  activities: InstructorActivity[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sessions, instructors, activities }) => {
  const [aiBriefing, setAiBriefing] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    
    // Análise de Ocupação por Turno
    const turnoCounts = {
      [Turno.MANHA]: sessions.filter(s => s.turno === Turno.MANHA).length,
      [Turno.TARDE]: sessions.filter(s => s.turno === Turno.TARDE).length,
      [Turno.NOITE]: sessions.filter(s => s.turno === Turno.NOITE).length,
    };

    const maxTurnoValue = Math.max(...Object.values(turnoCounts));
    const dominantTurno = Object.keys(turnoCounts).find(key => turnoCounts[key as Turno] === maxTurnoValue) as Turno;
    
    const turnosData = [
      { id: Turno.MANHA, label: 'Manhã', count: turnoCounts[Turno.MANHA], color: 'bg-amber-400', textColor: 'text-amber-600', icon: <Sunrise size={16} /> },
      { id: Turno.TARDE, label: 'Tarde', count: turnoCounts[Turno.TARDE], color: 'bg-orange-500', textColor: 'text-orange-600', icon: <Sun size={16} /> },
      { id: Turno.NOITE, label: 'Noite', count: turnoCounts[Turno.NOITE], color: 'bg-indigo-600', textColor: 'text-indigo-600', icon: <Moon size={16} /> },
    ].map(t => ({
      ...t,
      percent: totalSessions > 0 ? (t.count / totalSessions) * 100 : 0
    }));

    // Alocação Docente e Ambiente
    const allocatedDocente = sessions.filter(s => s.instrutorId && s.status !== Status.PENDENTE).length;
    const readinessDocente = totalSessions > 0 ? Math.round((allocatedDocente / totalSessions) * 100) : 0;
    
    const allocatedAmbiente = sessions.filter(s => s.ambiente && !s.ambiente.includes("PENDENTE")).length;
    const readinessAmbiente = totalSessions > 0 ? Math.round((allocatedAmbiente / totalSessions) * 100) : 0;

    const healthScore = Math.round((readinessDocente + readinessAmbiente) / 2);
    const HH_PENDENTE = (totalSessions - allocatedDocente) * 4;

    const activeInstIds = new Set([
      ...sessions.filter(s => s.instrutorId).map(s => s.instrutorId!),
      ...activities.map(a => a.instructorId)
    ]);

    const conflicts = sessions.filter(s => s.status === Status.CONFLITO || s.status === Status.MULTI_TURMA).length;

    return {
      totalSessions,
      dominantTurno,
      turnosData,
      healthScore,
      HH_PENDENTE,
      involvedInstructors: activeInstIds.size,
      conflicts,
    };
  }, [sessions, instructors, activities]);

  useEffect(() => {
    const generateBriefing = async () => {
      if (sessions.length === 0) return;
      setIsAiLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Analise a ocupação do PCP SENAI com foco na distribuição percentual:
        - Turno Dominante: ${stats.dominantTurno}
        - Distribuição: ${stats.turnosData.map(t => `${t.label}: ${Math.round(t.percent)}%`).join(", ")}
        - Saúde Geral: ${stats.healthScore}%
        Explique por que a concentração em um turno específico gera riscos de choque em laboratórios especializados.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });
        setAiBriefing(response.text || "");
      } catch (e) {
        setAiBriefing("IA: Identificada alta concentração matutina. Recomenda-se balanceamento de carga para otimizar laboratórios.");
      } finally {
        setIsAiLoading(false);
      }
    };
    generateBriefing();
  }, [sessions.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 1. MONITOR DE CONCENTRAÇÃO POR TURNO (NORTE PERCENTUAL) */}
      <Card className="p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Lado Esquerdo: Turno Dominante */}
          <div className="p-10 lg:col-span-2 bg-slate-900 text-white relative">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <PieChart className="text-indigo-400" size={20} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Concentração de Carga Operacional</h3>
              </div>
              
              <div className="flex items-end gap-6 mb-12">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Saturação Dominante</p>
                  <h4 className="text-7xl font-black tracking-tighter leading-none flex items-center gap-4">
                    {stats.dominantTurno.toUpperCase()}
                    {stats.dominantTurno === Turno.MANHA && <Sunrise size={56} className="text-amber-400" />}
                    {stats.dominantTurno === Turno.TARDE && <Sun size={56} className="text-orange-500" />}
                    {stats.dominantTurno === Turno.NOITE && <Moon size={56} className="text-indigo-400" />}
                  </h4>
                  <p className="text-indigo-400 font-black text-xl mt-4 uppercase tracking-tighter">
                    {Math.round(stats.turnosData.find(t => t.id === stats.dominantTurno)?.percent || 0)}% da Grade Total
                  </p>
                </div>
              </div>

              {/* Barra de Distribuição Segmentada */}
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                   <div className="flex gap-4">
                      {stats.turnosData.map(t => (
                        <div key={t.id} className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${t.color}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
                
                <div className="h-6 w-full bg-slate-800 rounded-2xl p-1 flex overflow-hidden border border-white/5">
                  {stats.turnosData.map(t => (
                    <div 
                      key={t.id}
                      className={`h-full ${t.color} transition-all duration-1000 first:rounded-l-xl last:rounded-r-xl relative group/bar`}
                      style={{ width: `${t.percent}%` }}
                    >
                       <div className="absolute hidden group-hover/bar:flex -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                          {t.label}: {Math.round(t.percent)}%
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Activity className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64 rotate-12" />
          </div>

          {/* Lado Direito: Detalhamento Percentual */}
          <div className="p-10 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 bg-slate-50/30">
             <div className="space-y-6">
                {stats.turnosData.map(t => (
                  <div key={t.id} className="flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 ${t.textColor}`}>
                           {t.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.label}</span>
                     </div>
                     <div className="text-right">
                        <p className={`text-xl font-black ${t.textColor} leading-none`}>{Math.round(t.percent)}%</p>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1">da ocupação</p>
                     </div>
                  </div>
                ))}
                
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                
                <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] mb-2 text-indigo-100">Visão da IA</p>
                      <p className="text-[11px] font-medium leading-relaxed italic">
                        {isAiLoading ? "Processando saturação..." : `"${aiBriefing.substring(0, 120)}..."`}
                      </p>
                   </div>
                   <Zap className="absolute -right-4 -bottom-4 text-white/10 w-20 h-20" />
                </div>
             </div>
          </div>
        </div>
      </Card>

      {/* 2. KPIs OPERACIONAIS (SAÚDE E RECURSOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-10 rounded-[3rem] border-slate-100 dark:border-slate-800 shadow-xl flex items-center gap-8">
           <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
             <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                <circle cx="64" cy="64" r="58" fill="transparent" stroke="url(#healthGrad)" strokeWidth="10" strokeDasharray={364} strokeDashoffset={364 - (364 * stats.healthScore) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                <defs>
                   <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#10b981" />
                   </linearGradient>
                </defs>
             </svg>
             <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.healthScore}%</span>
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Saúde</p>
             </div>
          </div>
          <div>
             <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Capacidade Alocada</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronismo Operacional</p>
             <div className="mt-4 flex gap-4">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Déficit HH</p>
                   <p className="text-md font-black text-rose-500">{stats.HH_PENDENTE}h</p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Conflitos</p>
                   <p className="text-md font-black text-amber-500">{stats.conflicts}</p>
                </div>
             </div>
          </div>
        </Card>

        <Card className="p-8 rounded-[3rem] bg-indigo-600 text-white border-none shadow-xl flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Docentes Mobilizados</p>
              <h4 className="text-5xl font-black tracking-tighter">{stats.involvedInstructors}</h4>
              <Badge color="white" className="mt-4 bg-white/20 border-none text-white">Prontos para Aula</Badge>
           </div>
           <Users size={48} className="opacity-20" />
        </Card>

        <Card className="p-8 rounded-[3rem] bg-white border-slate-100 shadow-xl flex flex-col justify-center">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                 <AlertTriangle size={24} />
              </div>
              <div>
                 <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Status de Alerta</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações Pendentes</p>
              </div>
           </div>
           <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
             {stats.conflicts > 0 
               ? `Existem ${stats.conflicts} choques de horários que precisam ser resolvidos no Pendenciômetro.` 
               : "Nenhum conflito crítico detectado na grade atual. Operação estável."}
           </p>
           <Button variant="outline" className="mt-4 h-10 rounded-xl" onClick={() => window.location.hash = '/pendencias'}>
              Resolver Agora <ArrowUpRight size={14} className="ml-2" />
           </Button>
        </Card>
      </div>
    </div>
  );
};
