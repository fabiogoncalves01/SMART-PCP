
import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, StatusChip } from '../components/UI';
import { 
  Clock, Calendar, UserPlus, MapPin, Zap, X, Check, 
  AlertCircle, Search, Sparkles, Filter, ChevronRight, Info, AlertTriangle, Users, Layers, Briefcase,
  UserX, Home, ArrowRightLeft, Loader2
} from 'lucide-react';
import { Status, Session, Instructor, InstructorActivity, Turno } from '../types';
import { GoogleGenAI } from "@google/genai";

interface PendenciesProps {
  sessions: Session[];
  instructors: Instructor[];
  activities: InstructorActivity[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
}

type FilterType = 'ALL' | Status.PENDENTE | Status.CONFLITO | Status.MULTI_TURMA;

export const Pendencies: React.FC<PendenciesProps> = ({ sessions, instructors, activities, setSessions }) => {
  const [allocatingSession, setAllocatingSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ instId: string, reason: string } | null>(null);

  // Lógica de Detecção de Conflitos Complexos
  const analyzedSessions = useMemo(() => {
    return sessions.map(session => {
      let status = session.status;
      let reasons: string[] = [];

      if (!session.instrutorId) {
        status = Status.PENDENTE;
        reasons.push("Docente não alocado");
      }

      if (!session.ambiente || session.ambiente.toUpperCase().includes("PENDENTE")) {
        status = Status.CONFLITO;
        reasons.push("Ambiente não definido");
      }

      if (session.instrutorId) {
        const inst = instructors.find(i => i.id === session.instrutorId);
        const inOtherTurma = sessions.some(s => 
          s.id !== session.id && 
          s.instrutorId === session.instrutorId && 
          s.data === session.data && 
          s.turno === session.turno &&
          !s.turmas.every(t => session.turmas.includes(t))
        );
        if (inOtherTurma) {
          status = Status.MULTI_TURMA;
          reasons.push("Docente já possui aula em outra turma");
        }

        const hasAdminChoque = activities.some(a => 
          a.instructorId === session.instrutorId && 
          a.date === session.data && 
          a.turno === session.turno
        );
        if (hasAdminChoque) {
          status = Status.CONFLITO;
          reasons.push("Choque com Atividade Administrativa/Extra");
        }

        if (inst) {
          const shiftMap: Record<string, Turno[]> = {
            'Matutino': [Turno.MANHA],
            'Vespertino': [Turno.TARDE],
            'Noturno': [Turno.NOITE],
            'Matutino/Vespertino': [Turno.MANHA, Turno.TARDE],
            'Vespertino/Noturno': [Turno.TARDE, Turno.NOITE]
          };
          const allowedTurnos = shiftMap[inst.turnoTrabalho] || [];
          if (!allowedTurnos.includes(session.turno)) {
            status = Status.CONFLITO;
            reasons.push(`Turno incompatível (Contrato: ${inst.turnoTrabalho})`);
          }
        }
      }

      return { ...session, status, conflitoDesc: reasons.join(" • ") };
    });
  }, [sessions, instructors, activities]);

  const allPends = analyzedSessions.filter(s => s.status !== Status.OK);

  const filteredPends = useMemo(() => {
    let result = activeFilter === 'ALL' ? allPends : allPends.filter(s => s.status === activeFilter);
    if (searchTerm) {
      result = result.filter(s => 
        s.turmas.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.unidadeCurricular.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.instrutor && s.instrutor.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return result;
  }, [allPends, activeFilter, searchTerm]);

  const handleAiSuggestion = async (session: Session) => {
    setAiLoading(session.id);
    setAiSuggestion(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Apenas instrutores ATIVOS para o prompt da IA
      const instContext = instructors.filter(i => i.status === 'Ativo').map(i => ({
        id: i.id,
        nome: i.nome,
        area: i.area,
        turno: i.turnoTrabalho,
        tipo: i.tipoContrato
      }));

      const prompt = `Como especialista em PCP SENAI, analise esta pendência e sugira o melhor docente ativo.
      DADOS DA AULA:
      - Unidade Curricular: ${session.unidadeCurricular}
      - Turma: ${session.turmas[0]}
      - Turno: ${session.turno}
      - Problema Atual: ${session.conflitoDesc}
      
      LISTA DE DOCENTES ATIVOS:
      ${JSON.stringify(instContext)}
      
      REGRAS: 
      1. O docente deve ser da mesma área ou ter afinidade.
      2. O turno de trabalho do contrato deve ser compatível com a aula.
      3. Retorne APENAS um JSON no formato: {"instId": "string", "reason": "string curta"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      if (result.instId) {
        setAiSuggestion(result);
        setAllocatingSession(session);
      }
    } catch (error) {
      console.error("Erro na IA:", error);
    } finally {
      setAiLoading(null);
    }
  };

  const candidates = useMemo(() => {
    if (!allocatingSession) return [];
    // Filtra apenas instrutores ATIVOS para os candidatos manuais
    return instructors.filter(i => i.status === 'Ativo').map(inst => {
      const hasClassConflict = analyzedSessions.some(s => 
        s.data === allocatingSession.data && 
        s.instrutorId === inst.id &&
        s.turno === allocatingSession.turno &&
        s.id !== allocatingSession.id
      );
      const hasAdminConflict = activities.some(a => 
        a.instructorId === inst.id && a.date === allocatingSession.date && a.turno === allocatingSession.turno
      );
      const isSameArea = inst.area !== 'Não Definida' && 
        allocatingSession.unidadeCurricular.toLowerCase().includes(inst.area.toLowerCase());
      
      return { 
        ...inst, 
        hasClassConflict, 
        hasAdminConflict,
        isSameArea, 
        score: (isSameArea ? 10 : 0) - (hasClassConflict ? 100 : 0) - (hasAdminConflict ? 50 : 0)
      };
    }).sort((a, b) => {
      if (aiSuggestion && a.id === aiSuggestion.instId) return -1;
      if (aiSuggestion && b.id === aiSuggestion.instId) return 1;
      return b.score - a.score;
    });
  }, [allocatingSession, instructors, analyzedSessions, activities, aiSuggestion]);

  const handleAllocate = (inst: any) => {
    if (!allocatingSession) return;
    setSessions(prev => prev.map(s => 
      s.id === allocatingSession.id 
        ? { 
            ...s, 
            instrutor: inst.nome, 
            instrutorId: inst.id, 
            status: (inst.hasClassConflict || inst.hasAdminConflict) ? Status.MULTI_TURMA : Status.OK 
          } 
        : s
    ));
    setAllocatingSession(null);
    setAiSuggestion(null);
  };

  return (
    <div className="space-y-6">
      <header className="bg-slate-900 rounded-lg p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">Central de Crise Operacional</h2>
          <p className="text-slate-400 text-sm font-medium">Filtros inteligentes para resolução de choques e ausência de recursos.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
             <AlertTriangle size={24} className="text-rose-500 animate-pulse" />
             <div>
               <span className="text-2xl font-black">{allPends.length}</span>
               <span className="text-[10px] font-black uppercase text-slate-500 block leading-none">Problemas</span>
             </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por turma, UC ou docente..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveFilter('ALL')} className={`px-5 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${activeFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Todos</button>
          <button onClick={() => setActiveFilter(Status.MULTI_TURMA)} className={`px-5 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${activeFilter === Status.MULTI_TURMA ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>Choques</button>
          <button onClick={() => setActiveFilter(Status.PENDENTE)} className={`px-5 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${activeFilter === Status.PENDENTE ? 'bg-indigo-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>Pendentes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPends.map((p) => (
          <Card key={p.id} className={`flex flex-col border-l-8 rounded-lg shadow-sm hover:shadow-md transition-all ${p.status === Status.MULTI_TURMA ? 'border-l-rose-500' : p.status === Status.PENDENTE ? 'border-l-indigo-600' : 'border-l-amber-500'}`}>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <Badge color={p.status === Status.MULTI_TURMA ? 'rose' : (p.conflitoDesc?.includes("Ambiente") ? 'amber' : 'indigo')}>
                   {p.conflitoDesc?.includes("Docente") ? <UserX size={12}/> : p.conflitoDesc?.includes("Ambiente") ? <Home size={12}/> : <AlertTriangle size={12}/>}
                   {p.status}
                </Badge>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{p.data}</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{p.turno}</p>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h4 className="text-lg font-black uppercase text-slate-800 tracking-tight leading-tight mb-2">{p.turmas[0]}</h4>
                <p className="text-[11px] font-bold text-slate-500 uppercase leading-snug">{p.unidadeCurricular}</p>
                {p.instrutor && <p className="text-[10px] font-black text-indigo-600 uppercase mt-2">Docente: {p.instrutor}</p>}
              </div>

              {p.conflitoDesc && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 flex gap-3 items-start mb-6">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black text-rose-800 uppercase leading-relaxed">{p.conflitoDesc}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="primary" 
                  className="flex-1 h-12 rounded-lg"
                  onClick={() => setAllocatingSession(p)}
                >
                  Corrigir
                </Button>
                <Button 
                  variant="secondary"
                  className="w-12 h-12 rounded-lg p-0 bg-indigo-50 border-indigo-100 text-indigo-600"
                  onClick={() => handleAiSuggestion(p)}
                  disabled={aiLoading === p.id}
                >
                  {aiLoading === p.id ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {allocatingSession && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <Card className="w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><ArrowRightLeft size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase">Sugestões de Alocação</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Resolução para {allocatingSession.data} ({allocatingSession.turno})</p>
                </div>
              </div>
              <button onClick={() => { setAllocatingSession(null); setAiSuggestion(null); }} className="text-slate-400 hover:text-rose-500"><X size={32} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 bg-white grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Candidatos Disponíveis</h4>
                {candidates.map(inst => {
                  const isSuggested = aiSuggestion && inst.id === aiSuggestion.instId;
                  return (
                    <div 
                      key={inst.id} 
                      onClick={() => handleAllocate(inst)}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between relative ${isSuggested ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/10' : inst.hasClassConflict || inst.hasAdminConflict ? 'border-rose-200 bg-rose-50/30' : inst.isSameArea ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100'}`}
                    >
                      {isSuggested && (
                        <div className="absolute -top-3 -right-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg">
                          <Sparkles size={10} /> Recomendação IA
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${inst.hasClassConflict ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
                          {inst.nome.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{inst.nome}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge color="slate" className="scale-75 origin-left">{inst.area}</Badge>
                            {(inst.hasClassConflict || inst.hasAdminConflict) && <Badge color="rose" className="scale-75 origin-left">Choque de Horário</Badge>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-indigo-400" />
                    </div>
                  );
                })}
              </div>
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 space-y-6 border border-slate-100">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Detalhes do Evento</h4>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Unidade Curricular</p>
                      <p className="text-xs font-black text-slate-800 uppercase">{allocatingSession.unidadeCurricular}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Turma</p>
                      <p className="text-xs font-black text-slate-800 uppercase">{allocatingSession.turmas[0]}</p>
                    </div>
                  </div>
                </div>

                {aiSuggestion && (
                  <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 animate-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="text-indigo-400" size={24} />
                      <h4 className="text-sm font-black uppercase tracking-widest">Razão da IA</h4>
                    </div>
                    <p className="text-xs text-indigo-100 font-medium leading-relaxed italic">
                      "{aiSuggestion.reason}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
