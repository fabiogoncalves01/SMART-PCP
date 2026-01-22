
import React, { useState, useMemo, useRef } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { 
  Clock, Calculator, Calendar, Info, Save, TrendingUp, 
  ChevronLeft, ChevronRight, Plus, Trash2, Briefcase, 
  AlertCircle, Coffee, CalendarDays, X, Calendar as CalendarIcon,
  Sun, Sunrise, Moon, FileUp, Loader2, Check, AlertTriangle,
  UserPlus, UserMinus, UserCheck
} from 'lucide-react';
import { Instructor, TipoContrato, ActivityCode, InstructorActivity, TurnoTrabalho, Turno, Area } from '../types';

interface ContractCapacityProps {
  instructors: Instructor[];
  setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
  activities: InstructorActivity[];
  setActivities: React.Dispatch<React.SetStateAction<InstructorActivity[]>>;
}

const slugify = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]/g, "")
     .trim();

export const ContractCapacity: React.FC<ContractCapacityProps> = ({ 
  instructors, 
  setInstructors,
  activities,
  setActivities
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 1));
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreview, setImportPreview] = useState<{ name: string, hours: number, matchedId: string | null }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para o Modal de Lançamento de Atividade
  const [modalInstructor, setModalInstructor] = useState(instructors[0]?.id || '');
  const [modalCode, setModalCode] = useState<ActivityCode>(ActivityCode.PL);
  const [modalHours, setModalHours] = useState(4);
  const [modalTurno, setModalTurno] = useState<Turno>(Turno.MANHA);
  const [tempDates, setTempDates] = useState<string[]>([]);
  const [modalCalendarMonth, setModalCalendarMonth] = useState(new Date(2026, 0, 1));

  // Estado para Novo Docente
  const [newDocente, setNewDocente] = useState({
    nome: '',
    area: Area.NAO_DEFINIDA,
    tipoContrato: TipoContrato.MENSALISTA,
    turnoTrabalho: TurnoTrabalho.MATUTINO_VESPERTINO
  });

  const monthYearLabel = useMemo(() => {
    return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  }, [selectedDate]);

  const monthStr = selectedDate.toISOString().substring(0, 7);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const toggleContractType = (id: string) => {
    setInstructors(prev => prev.map(inst => 
      inst.id === id 
        ? { ...inst, tipoContrato: inst.tipoContrato === TipoContrato.MENSALISTA ? TipoContrato.HORISTA : TipoContrato.MENSALISTA } 
        : inst
    ));
  };

  const toggleStatus = (id: string) => {
    setInstructors(prev => prev.map(inst => 
      inst.id === id ? { ...inst, status: inst.status === 'Ativo' ? 'Inativo' : 'Ativo' } : inst
    ));
  };

  const deleteInstructor = (id: string, nome: string) => {
    if (window.confirm(`⚠️ EXCLUSÃO DEFINITIVA: Deseja remover ${nome} do sistema?`)) {
      setInstructors(prev => prev.filter(inst => inst.id !== id));
    }
  };

  const handleAddDocente = () => {
    if (!newDocente.nome) return;
    const instructor: Instructor = {
      id: `inst-manual-${Date.now()}`,
      nome: newDocente.nome.toUpperCase(),
      area: newDocente.area,
      tipoContrato: newDocente.tipoContrato,
      cargaSemanalHoras: 40,
      status: 'Ativo',
      turnoTrabalho: newDocente.turnoTrabalho
    };
    setInstructors(prev => [instructor, ...prev]);
    setShowAddModal(false);
    setNewDocente({ nome: '', area: Area.NAO_DEFINIDA, tipoContrato: TipoContrato.MENSALISTA, turnoTrabalho: TurnoTrabalho.MATUTINO_VESPERTINO });
  };

  const updateTurnoTrabalho = (id: string, turno: TurnoTrabalho) => {
    setInstructors(prev => prev.map(inst => 
      inst.id === id ? { ...inst, turnoTrabalho: turno } : inst
    ));
  };

  const updateCarga = (id: string, hours: number) => {
    setInstructors(prev => prev.map(inst => 
      inst.id === id ? { ...inst, cargaSemanalHoras: hours / 4 } : inst
    ));
  };

  // Importação CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => ['nome', 'docente', 'professor', 'instrutor'].some(k => h.includes(k)));
      const hoursIdx = headers.findIndex(h => ['carga', 'horas', 'mensal', 'total'].some(k => h.includes(k)));
      const results: { name: string, hours: number, matchedId: string | null }[] = [];
      lines.slice(1).forEach(row => {
        const cols = row.split(delimiter).map(c => c.trim().replace(/"/g, ''));
        const name = cols[nameIdx];
        const rawHours = cols[hoursIdx];
        const hours = parseFloat(rawHours);
        if (name && !isNaN(hours)) {
          const matched = instructors.find(i => slugify(i.nome) === slugify(name));
          results.push({ name, hours, matchedId: matched?.id || null });
        }
      });
      setImportPreview(results);
      setShowImportModal(true);
      setIsProcessing(false);
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const confirmImport = () => {
    setInstructors(prev => prev.map(inst => {
      const match = importPreview.find(p => p.matchedId === inst.id);
      if (match) return { ...inst, cargaSemanalHoras: match.hours / 4, tipoContrato: TipoContrato.HORISTA };
      return inst;
    }));
    setShowImportModal(false);
    setImportPreview([]);
  };

  // Calendário do Modal
  const toggleDateSelection = (dateStr: string) => {
    setTempDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort());
  };

  const modalCalendarDays = useMemo(() => {
    const year = modalCalendarMonth.getFullYear();
    const month = modalCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [modalCalendarMonth]);

  const addActivitiesBatch = () => {
    if (tempDates.length === 0) return;
    const newActivities: InstructorActivity[] = tempDates.map(date => ({
      id: Math.random().toString(36).substr(2, 9),
      instructorId: modalInstructor,
      code: modalCode,
      hours: modalHours,
      date: date,
      turno: modalTurno
    }));
    setActivities(prev => [...prev, ...newActivities]);
    setShowActivityModal(false);
    setTempDates([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Contrato e Capacidade</h2>
            <p className="text-indigo-200 text-sm font-medium opacity-80">
              Gestão integral de <span className="text-white font-bold">Mensalistas/Horistas</span>, turnos e lançamentos extra-grade.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur-xl">
            <button onClick={() => navigateMonth('prev')} className="p-4 hover:bg-white/10 rounded-full transition-all text-indigo-300">
              <ChevronLeft size={24} />
            </button>
            <div className="min-w-[200px] text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 block mb-1">Mês de Referência</span>
              <span className="text-xl font-black tracking-tight">{monthYearLabel}</span>
            </div>
            <button onClick={() => navigateMonth('next')} className="p-4 hover:bg-white/10 rounded-full transition-all text-indigo-300">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} />
            <Button variant="outline" className="h-14 rounded-3xl px-6 border-white/20 text-white hover:bg-white/10" onClick={() => fileInputRef.current?.click()}>
              <FileUp size={20} /> Importar Carga
            </Button>
            <Button variant="outline" className="h-14 rounded-3xl px-6 border-indigo-400 text-indigo-400 bg-indigo-950/30" onClick={() => setShowAddModal(true)}>
              <UserPlus size={20} /> Novo Docente
            </Button>
            <Button variant="primary" className="h-14 rounded-3xl px-6 shadow-xl shadow-indigo-500/20" onClick={() => setShowActivityModal(true)}>
              <Plus size={20} /> Atividade Extra
            </Button>
          </div>
        </div>
        <Calculator className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64 rotate-12" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <Card className="xl:col-span-3 p-0 overflow-hidden shadow-2xl border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-6">Docente / Vínculo</th>
                  <th className="px-8 py-6">Turno Base</th>
                  <th className="px-8 py-6">Carga Mensal</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Ações de Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {instructors.map((inst) => {
                  const cargaMensalTotal = (inst.cargaSemanalHoras || 0) * 4;
                  const isInactive = inst.status === 'Inativo';
                  return (
                    <tr key={inst.id} className={`transition-all group ${isInactive ? 'bg-slate-50 opacity-60 grayscale' : 'hover:bg-indigo-50/20'}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                            inst.tipoContrato === TipoContrato.MENSALISTA ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {inst.tipoContrato === TipoContrato.MENSALISTA ? <Briefcase size={16} /> : <Clock size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 tracking-tight uppercase">{inst.nome}</p>
                            <button onClick={() => toggleContractType(inst.id)} className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded border ${
                              inst.tipoContrato === TipoContrato.MENSALISTA ? 'text-indigo-600 border-indigo-100 bg-indigo-50' : 'text-amber-600 border-amber-100 bg-amber-50'
                            }`}>{inst.tipoContrato}</button>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={inst.turnoTrabalho}
                          onChange={(e) => updateTurnoTrabalho(inst.id, e.target.value as TurnoTrabalho)}
                          disabled={isInactive}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black text-slate-600 outline-none focus:border-indigo-500 uppercase"
                        >
                          {Object.values(TurnoTrabalho).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            value={cargaMensalTotal}
                            disabled={isInactive}
                            onChange={(e) => updateCarga(inst.id, Number(e.target.value))}
                            className="w-20 bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-xs font-black text-slate-700 focus:border-indigo-500 outline-none"
                          />
                          <span className="text-[10px] font-black text-slate-300">H</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge color={!isInactive ? 'emerald' : 'rose'} className="px-3 py-1">
                          {!isInactive ? <UserCheck size={12}/> : <UserMinus size={12}/>}
                          {inst.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => toggleStatus(inst.id)} className="h-10 px-4 rounded-xl border border-slate-200" title={!isInactive ? 'Inativar Docente' : 'Reativar Docente'}>
                            {!isInactive ? <UserMinus size={16} /> : <UserCheck size={16} />}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => deleteInstructor(inst.id, inst.nome)} className="h-10 px-4 rounded-xl border-rose-100" title="Excluir Definitivamente">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Agenda Extra-Grade">
            <div className="space-y-4">
              {activities.filter(a => a.date.startsWith(monthStr)).length === 0 ? (
                <div className="text-center py-10 opacity-40">
                  <Coffee size={32} className="mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                  {activities.filter(a => a.date.startsWith(monthStr)).sort((a, b) => a.date.localeCompare(b.date)).map(act => {
                      const inst = instructors.find(i => i.id === act.instructorId);
                      const d = new Date(act.date + 'T00:00:00');
                      return (
                        <div key={act.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center">
                              <span className="text-[10px] font-black text-slate-800 leading-none">{d.getDate()}</span>
                              <span className="text-[7px] font-black text-indigo-500 uppercase">{d.getMonth()+1}</span>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1 truncate max-w-[120px]">{inst?.nome}</p>
                              <Badge color="slate" className="scale-75 origin-left">{act.code} | {act.hours}h</Badge>
                            </div>
                          </div>
                          <button onClick={() => setActivities(prev => prev.filter(a => a.id !== act.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL NOVO DOCENTE */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-6 animate-in fade-in duration-300">
           <Card className="w-full max-w-xl p-12 rounded-[4rem] shadow-3xl relative border-slate-800 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
              <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-rose-500 transition-all hover:rotate-90">
                <X size={40} />
              </button>
              
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                  <UserPlus size={40} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">Cadastrar Docente</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3">Novo membro da base cadastral PCP</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nome do Funcionário</label>
                  <input type="text" placeholder="DIGITE O NOME COMPLETO..." className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.5rem] px-6 py-4 text-sm font-black uppercase outline-none focus:border-indigo-500 transition-all" value={newDocente.nome} onChange={(e) => setNewDocente({...newDocente, nome: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Área de Atuação</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.5rem] px-4 py-4 text-xs font-black outline-none focus:border-indigo-500 appearance-none uppercase" value={newDocente.area} onChange={(e) => setNewDocente({...newDocente, area: e.target.value as Area})}>
                      {Object.values(Area).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Contrato</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.5rem] px-4 py-4 text-xs font-black outline-none focus:border-indigo-500 appearance-none uppercase" value={newDocente.tipoContrato} onChange={(e) => setNewDocente({...newDocente, tipoContrato: e.target.value as TipoContrato})}>
                      <option value={TipoContrato.MENSALISTA}>MENSALISTA</option>
                      <option value={TipoContrato.HORISTA}>HORISTA</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Turno Base de Contrato</label>
                   <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.5rem] px-6 py-4 text-xs font-black outline-none focus:border-indigo-500 appearance-none uppercase" value={newDocente.turnoTrabalho} onChange={(e) => setNewDocente({...newDocente, turnoTrabalho: e.target.value as TurnoTrabalho})}>
                      {Object.values(TurnoTrabalho).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>

                <Button variant="primary" className="w-full h-16 rounded-[1.5rem] shadow-2xl text-xs uppercase font-black" onClick={handleAddDocente}>Confirmar Novo Funcionário</Button>
              </div>
           </Card>
        </div>
      )}

      {/* OUTROS MODAIS EXISTENTES ... */}
      {showActivityModal && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-10 shadow-3xl animate-in zoom-in-95 duration-200 relative overflow-hidden rounded-[3rem]">
            <button onClick={() => setShowActivityModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-rose-500 transition-all z-20"><X size={24} /></button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2 flex items-center gap-3"><CalendarDays className="text-indigo-600" /> Agendar Atividade</h3>
                <div className="space-y-4">
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" value={modalInstructor} onChange={(e) => setModalInstructor(e.target.value)}>
                    {instructors.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" value={modalCode} onChange={(e) => setModalCode(e.target.value as ActivityCode)}>
                      {Object.values(ActivityCode).map(code => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" value={modalHours} onChange={(e) => setModalHours(Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[Turno.MANHA, Turno.TARDE, Turno.NOITE].map(t => (
                      <button key={t} onClick={() => setModalTurno(t)} className={`p-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${modalTurno === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <Button variant="primary" className="w-full rounded-2xl h-14" onClick={addActivitiesBatch} disabled={tempDates.length === 0}>Processar Lote ({tempDates.length} dias)</Button>
                </div>
              </div>
              <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{modalCalendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setModalCalendarMonth(new Date(modalCalendarMonth.getFullYear(), modalCalendarMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronLeft size={20} /></button>
                    <button onClick={() => setModalCalendarMonth(new Date(modalCalendarMonth.getFullYear(), modalCalendarMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronRight size={20} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-center text-[9px] font-black text-slate-300 py-2">{d}</div>)}
                  {modalCalendarDays.map((dateStr, idx) => {
                    if (!dateStr) return <div key={`empty-${idx}`} />;
                    const isSelected = tempDates.includes(dateStr);
                    const day = parseInt(dateStr.split('-')[2]);
                    return (
                      <button key={dateStr} onClick={() => toggleDateSelection(dateStr)} className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-black transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 text-slate-600'}`}>{day}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-0 shadow-3xl animate-in zoom-in-95 duration-200 overflow-hidden rounded-[2.5rem]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Preview de Importação</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-rose-500"><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[400px] overflow-y-auto no-scrollbar space-y-3">
              {importPreview.map((item, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${item.matchedId ? 'bg-indigo-50/20 border-indigo-100' : 'bg-rose-50/20 border-rose-100'}`}>
                  <p className="text-[11px] font-black text-slate-800 uppercase">{item.name}</p>
                  <span className="text-sm font-black text-slate-700">{item.hours}h</span>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-900 flex items-center justify-between">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{importPreview.filter(p => p.matchedId).length} Matches</div>
              <div className="flex gap-4">
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowImportModal(false)}>Cancelar</Button>
                <Button variant="primary" className="px-10" onClick={confirmImport}>Confirmar e Aplicar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
