
import React, { useState, useMemo } from 'react';
import { 
  Trash2, Plus, LayoutGrid, ChevronLeft, ChevronRight, 
  Repeat, ArrowLeft, Check, X, Search, MapPin, Calendar, 
  Sparkles, Filter, Briefcase, Coffee, Target, Info, Clock, UserPlus, CalendarDays,
  Users, Loader2
} from 'lucide-react';
import { Card, Badge, Button } from '../components/UI';
import { Session, Instructor, TurmaCurso, Status, Turno, Area } from '../types';
import { GoogleGenAI } from "@google/genai";

interface SchedulePlannerProps {
  turmas: TurmaCurso[];
  instructors: Instructor[];
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  addLog: (action: string, details: string) => void;
}

export const SchedulePlanner: React.FC<SchedulePlannerProps> = ({ turmas, instructors, sessions, setSessions, addLog }) => {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  
  const [tempAlloc, setTempAlloc] = useState({ 
    instrutorId: '', 
    ucId: '', 
    ambiente: '',
    recorrencia: false,
    dataInicio: '',
    dataFim: '',
    diasSemana: [false, true, true, true, true, true, false] // D, S, T, Q, Q, S, S
  });

  const selectedTurma = useMemo(() => 
    turmas.find(t => t.id === selectedTurmaId), 
  [turmas, selectedTurmaId]);

  const slots = useMemo(() => {
    if (!selectedTurma) return [];
    const [startH, startM] = selectedTurma.horarioInicio.split(':').map(Number);
    const [endH, endM] = selectedTurma.horarioFim.split(':').map(Number);
    let currentTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;
    const calculatedSlots = [];
    let aulaCounter = 1;

    while (currentTotalMinutes + selectedTurma.horaAula <= endTotalMinutes) {
      const h = Math.floor(currentTotalMinutes / 60);
      const m = currentTotalMinutes % 60;
      const nextTotal = currentTotalMinutes + selectedTurma.horaAula;
      
      calculatedSlots.push({ 
        label: `${aulaCounter}ª Aula`, 
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} - ${String(Math.floor(nextTotal / 60)).padStart(2, '0')}:${String(nextTotal % 60).padStart(2, '0')}`,
        start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        index: aulaCounter
      });
      
      currentTotalMinutes = nextTotal;
      if (aulaCounter === 2) currentTotalMinutes += 20;
      aulaCounter++;
    }
    return calculatedSlots;
  }, [selectedTurma]);

  const allDays = useMemo(() => {
    if (!selectedTurma) return [];
    const days = [];
    const start = new Date(selectedTurma.dataInicio + 'T12:00:00');
    const end = new Date(selectedTurma.dataFim + 'T12:00:00');
    let curr = new Date(start);
    while (curr <= end) {
      if (curr.getDay() !== 0) days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [selectedTurma]);

  const matrizProgress = useMemo(() => {
    if (!selectedTurma) return [];
    return selectedTurma.matriz.map(uc => {
      const allocatedSessions = sessions.filter(s => 
        s.turmas.includes(selectedTurma.nome) && s.unidadeCurricular === uc.nome
      );
      const allocatedCH = (allocatedSessions.length * selectedTurma.horaAula) / 60;
      const percent = Math.min(Math.round((allocatedCH / uc.ch) * 100), 100);
      return { ...uc, allocatedCH, percent };
    });
  }, [selectedTurma, sessions]);

  const totalAtingimento = useMemo(() => {
    if (matrizProgress.length === 0) return 0;
    return Math.round(matrizProgress.reduce((acc, curr) => acc + curr.percent, 0) / matrizProgress.length);
  }, [matrizProgress]);

  const filteredInstructors = useMemo(() => {
    if (!selectedTurma) return instructors;
    return instructors.filter(inst => inst.area === selectedTurma.area);
  }, [instructors, selectedTurma]);

  const handleAiOptimization = async () => {
    if (!selectedTurma) return;
    setIsAiOptimizing(true);
    addLog('IA_OPTIMIZE_START', `Iniciando otimização em lote para turma ${selectedTurma.nome}`);

    try {
      // Corrected: Always use the exact initialization format required by Google GenAI guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Encontrar slots vazios
      const emptySlots: any[] = [];
      allDays.slice(0, 10).forEach(date => { // Pegar só 10 dias para não estourar tokens
        const dStr = date.toISOString().split('T')[0];
        slots.forEach((slot, sIdx) => {
          const exists = sessions.find(s => s.data === dStr && s.inicio === slot.start && s.turmas.includes(selectedTurma.nome));
          if (!exists) {
            emptySlots.push({ date: dStr, slotIndex: sIdx, label: slot.label });
          }
        });
      });

      if (emptySlots.length === 0) {
        alert("Não há slots vazios nos próximos dias para otimizar.");
        setIsAiOptimizing(false);
        return;
      }

      const prompt = `Como coordenador de PCP, preencha estes slots vazios da turma ${selectedTurma.nome} (${selectedTurma.area}).
      SLOTS VAZIOS: ${JSON.stringify(emptySlots)}
      MATRIZ DA TURMA: ${JSON.stringify(selectedTurma.matriz)}
      DOCENTES DISPONÍVEIS: ${JSON.stringify(filteredInstructors.map(i => ({id: i.id, nome: i.nome})))}
      
      REGRAS: 
      1. Distribua as UCs que estão com menor progresso.
      2. Não repita o mesmo docente em horários conflitantes.
      3. Retorne um ARRAY JSON de alocações sugeridas no formato: 
      [{"date": "string", "slotIndex": number, "instrutorId": "string", "ucId": "string", "reason": "string"}]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const suggestions = JSON.parse(response.text || "[]");
      
      const newSessions: Session[] = suggestions.map((sug: any) => {
        const inst = instructors.find(i => i.id === sug.instrutorId);
        const uc = selectedTurma.matriz.find(u => u.id === sug.ucId);
        const slot = slots[sug.slotIndex];
        return {
          id: `ai-sess-${Date.now()}-${Math.random()}`,
          data: sug.date,
          inicio: slot.start,
          fim: "",
          turno: selectedTurma.turno,
          turmas: [selectedTurma.nome],
          instrutor: inst?.nome || null,
          instrutorId: inst?.id,
          ambiente: "SALA IA",
          unidadeCurricular: uc?.nome || "UC IA",
          status: Status.OK
        };
      });

      setSessions(prev => [...prev, ...newSessions]);
      addLog('IA_OPTIMIZE_SUCCESS', `Otimizador IA preencheu ${newSessions.length} slots automaticamente.`);
      alert(`Otimização Concluída! ${newSessions.length} aulas foram agendadas pela IA.`);
    } catch (error) {
      console.error(error);
      addLog('IA_OPTIMIZE_ERROR', `Falha ao executar otimizador.`);
    } finally {
      setIsAiOptimizing(false);
    }
  };

  const toggleSlotSelection = (dateStr: string, slotIdx: number) => {
    const key = `${dateStr}|${slotIdx}`;
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAllocateSelected = () => {
    if (!selectedTurma) return;
    const instructor = instructors.find(i => i.id === tempAlloc.instrutorId);
    const uc = selectedTurma.matriz.find(u => u.id === tempAlloc.ucId);
    let targetKeys = Array.from(selectedSlots);

    if (tempAlloc.recorrencia) {
      const expandedKeys = new Set(selectedSlots);
      selectedSlots.forEach(key => {
        const [dateStr, slotIdx] = (key as string).split('|');
        let currDate = new Date(dateStr + 'T12:00:00');
        const endDate = new Date(tempAlloc.dataFim || selectedTurma.dataFim + 'T12:00:00');
        while (currDate <= endDate) {
          currDate.setDate(currDate.getDate() + 1);
          if (tempAlloc.diasSemana[currDate.getDay()] && currDate <= endDate) {
            expandedKeys.add(`${currDate.toISOString().split('T')[0]}|${slotIdx}`);
          }
        }
      });
      targetKeys = Array.from(expandedKeys);
    }

    const newSessions: Session[] = targetKeys.map(key => {
      const [dateStr, slotIdxStr] = (key as string).split('|');
      const slotIdx = parseInt(slotIdxStr);
      const slot = slots[slotIdx];
      const [inicio, fim] = slot.time.split(' - ');
      return {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        data: dateStr, inicio, fim, turno: selectedTurma.turno,
        turmas: [selectedTurma.nome],
        instrutor: instructor?.nome || null, instrutorId: instructor?.id,
        ambiente: tempAlloc.ambiente || 'SALA PENDENTE',
        unidadeCurricular: uc?.nome || 'UC PENDENTE',
        status: instructor ? Status.OK : Status.PENDENTE
      };
    });

    setSessions(prev => {
      const filteredPrev = prev.filter(p => !targetKeys.some(tk => {
        const [d, idxStr] = (tk as string).split('|');
        return p.data === d && p.inicio === slots[parseInt(idxStr)].start && p.turmas.includes(selectedTurma.nome);
      }));
      return [...filteredPrev, ...newSessions];
    });

    addLog('ALOCAÇÃO_MANUAL', `${newSessions.length} aulas alocadas na turma ${selectedTurma.nome}`);
    setSelectedSlots(new Set());
    setAllocationModalOpen(false);
  };

  if (!selectedTurmaId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tight">Planejador de Grade</h2>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Buscar turmas..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-indigo-500 dark:text-white outline-none"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase())).map(turma => (
            <Card key={turma.id} className="hover:border-indigo-400 cursor-pointer group rounded-[2.5rem] p-8" onClick={() => setSelectedTurmaId(turma.id)}>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><LayoutGrid size={28} /></div>
                <Badge color="indigo">{turma.area}</Badge>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3">{turma.nome}</h3>
              <Button variant="primary" className="w-full mt-4 h-12 rounded-xl">Abrir Planejador</Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-in fade-in duration-500">
      <header className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedTurmaId(null)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white tracking-tighter">{selectedTurma?.nome}</h2>
              <Badge color="indigo" className="text-[8px]">{selectedTurma?.area}</Badge>
            </div>
            <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">{selectedTurma?.dataInicio} - {selectedTurma?.dataFim}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="rounded-xl h-10 border-indigo-100 text-indigo-600" onClick={handleAiOptimization} disabled={isAiOptimizing}>
            {isAiOptimizing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />} Otimizador IA
          </Button>
          <div className="bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-indigo-100">
            <Target size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Atingimento Matrix: <span className="text-indigo-600">{totalAtingimento}%</span></span>
          </div>
          {selectedSlots.size > 0 && (
            <Button variant="primary" className="rounded-xl h-10 px-6 shadow-lg shadow-indigo-100 animate-in slide-in-from-right-4" onClick={() => setAllocationModalOpen(true)}>
              Alocar {selectedSlots.size} Aulas
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <aside className="w-80 flex flex-col gap-4">
          <Card className="flex-1 p-6 flex flex-col gap-6 rounded-[2rem] border-slate-100">
            <div className="flex items-center gap-3 mb-2">
               <Briefcase size={16} className="text-indigo-600" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progresso da Matriz</h3>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
              {matrizProgress.map(uc => (
                <div key={uc.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none">{uc.nome}</p>
                    <span className="text-[10px] font-black text-indigo-600">{uc.percent}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${uc.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <div className="flex-1 overflow-x-auto no-scrollbar bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 relative">
          <div className="flex h-full p-6 gap-4 min-w-max">
            {allDays.map((date, dayIdx) => {
              const dateStr = date.toISOString().split('T')[0];
              return (
                <div key={dayIdx} className="w-[280px] flex flex-col gap-4">
                  <div className="p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{date.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white tracking-tighter">{date.toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                    {slots.map((slot, sIdx) => {
                      const session = sessions.find(s => s.data === dateStr && s.inicio === slot.time.split(' - ')[0] && s.turmas.includes(selectedTurma?.nome || ''));
                      const isSelected = selectedSlots.has(`${dateStr}|${sIdx}`);
                      return (
                        <React.Fragment key={sIdx}>
                          <div onClick={() => !session && toggleSlotSelection(dateStr, sIdx)} className={`p-5 rounded-2xl border transition-all cursor-pointer relative group/slot ${session ? 'bg-white border-slate-100 shadow-sm' : isSelected ? 'bg-indigo-50 border-indigo-500 shadow-lg' : 'bg-white/40 border-dashed border-slate-200 hover:bg-white'}`}>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{slot.label} • {slot.time}</span>
                            {session ? (
                              <div className="mt-2">
                                <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none mb-1">{session.instrutor || 'DOCENTE PENDENTE'}</h4>
                                <Badge color="slate" className="scale-75 origin-left opacity-70 mt-1">{session.unidadeCurricular}</Badge>
                              </div>
                            ) : (
                              <div className="h-10 flex items-center justify-center opacity-0 group-hover/slot:opacity-30">{isSelected ? <Check size={20} className="text-indigo-600" /> : <Plus size={18} />}</div>
                            )}
                          </div>
                          {slot.index === 2 && (
                            <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl px-4 py-2 flex items-center justify-between">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Intervalo Escolar (20 min)</span>
                              <Coffee size={12} className="text-amber-500" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {allocationModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-[1000px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <Repeat size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">Configurar Alocação</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Turma {selectedTurma?.nome} • Área: <span className="text-indigo-600">{selectedTurma?.area}</span></p>
                </div>
              </div>
              <button onClick={() => setAllocationModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-all">
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                     <Users size={18} className="text-indigo-600" />
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Disponíveis na Área ({selectedTurma?.area})</h4>
                   </div>
                   <div className="space-y-3">
                     {filteredInstructors.map(inst => (
                       <div key={inst.id} onClick={() => setTempAlloc({...tempAlloc, instrutorId: inst.id})} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${tempAlloc.instrutorId === inst.id ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200'}`}>
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-xs text-slate-800">{inst.nome.substring(0, 2).toUpperCase()}</div>
                           <div>
                             <p className="text-[11px] font-black text-slate-800 uppercase">{inst.nome}</p>
                             <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Livre nas datas</span>
                           </div>
                         </div>
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tempAlloc.instrutorId === inst.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>{tempAlloc.instrutorId === inst.id && <Check size={14} />}</div>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Unidade Curricular</label>
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:border-indigo-500" value={tempAlloc.ucId} onChange={(e) => setTempAlloc({...tempAlloc, ucId: e.target.value})}>
                      <option value="">Selecione a UC...</option>
                      {selectedTurma?.matriz.map(uc => <option key={uc.id} value={uc.id}>{uc.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Ambiente</label>
                    <input type="text" placeholder="Ex: Laboratório de Redes" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:border-indigo-500" value={tempAlloc.ambiente} onChange={(e) => setTempAlloc({...tempAlloc, ambiente: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="w-[360px] bg-slate-900 p-10 flex flex-col gap-10 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4"><CalendarDays size={24} className="text-indigo-400" /><h4 className="text-sm font-black uppercase tracking-widest">Recorrência</h4></div>
                  <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={tempAlloc.recorrencia} onChange={(e) => setTempAlloc({...tempAlloc, recorrencia: e.target.checked})}/><div className="w-12 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner" /></label>
                </div>
                {tempAlloc.recorrencia && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Término</label><input type="date" value={tempAlloc.dataFim} onChange={(e) => setTempAlloc({...tempAlloc, dataFim: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-[10px] text-white outline-none focus:border-indigo-500" /></div>
                    </div>
                  </div>
                )}
                <div className="mt-auto p-6 bg-white/5 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black text-slate-400 uppercase mb-4">Ação em Massa</p><p className="text-[9px] text-slate-500">Alocando {selectedSlots.size} horários iniciais.</p></div>
              </div>
            </div>

            <div className="bg-slate-950 p-6 flex items-center justify-between px-10">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3"><Calendar size={18} className="text-indigo-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Turno: <span className="text-white">{selectedTurma?.turno}</span></span></div>
              </div>
              <div className="flex gap-6">
                <button onClick={() => setAllocationModalOpen(false)} className="text-white text-[10px] font-black uppercase tracking-widest hover:text-rose-400 transition-colors">Descartar</button>
                <Button variant="primary" className="h-14 px-10 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-900/50" onClick={handleAllocateSelected}>Confirmar Alocação</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};
