
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

  const [modalInstructor, setModalInstructor] = useState(instructors[0]?.id || '');
  const [modalCode, setModalCode] = useState<ActivityCode>(ActivityCode.PL);
  const [modalHours, setModalHours] = useState(4);
  const [modalTurno, setModalTurno] = useState<Turno>(Turno.MANHA);
  const [tempDates, setTempDates] = useState<string[]>([]);
  const [modalCalendarMonth, setModalCalendarMonth] = useState(new Date(2026, 0, 1));

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
              Gestão de <span className="text-white font-bold">Base Docente</span>, turnos e lançamentos extra-grade.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} />
            <Button variant="outline" className="h-14 rounded-3xl px-6 border-white/20 text-white hover:bg-white/10" onClick={() => fileInputRef.current?.click()}>
              <FileUp size={20} /> Importar Carga
            </Button>
            <Button variant="primary" className="h-14 rounded-3xl px-6 shadow-xl shadow-indigo-500/20" onClick={() => setShowAddModal(true)}>
              <UserPlus size={20} /> Novo Docente
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-2xl border-slate-200">
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
                          inst.tipoContrato === TipoContrato.MENSALISTA ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {inst.tipoContrato === TipoContrato.MENSALISTA ? <Briefcase size={16} /> : <Clock size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 tracking-tight uppercase">{inst.nome}</p>
                          <button onClick={() => toggleContractType(inst.id)} className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded border ${
                            inst.tipoContrato === TipoContrato.MENSALISTA ? 'text-indigo-600 border-indigo-100' : 'text-amber-600 border-amber-100'
                          }`}>{inst.tipoContrato}</button>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <select 
                        value={inst.turnoTrabalho}
                        onChange={(e) => updateTurnoTrabalho(inst.id, e.target.value as TurnoTrabalho)}
                        disabled={isInactive}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase"
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
                          className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge color={!isInactive ? 'emerald' : 'rose'}>{inst.status}</Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => toggleStatus(inst.id)} className="h-10 px-4 rounded-xl">
                          {!isInactive ? <UserMinus size={16} /> : <UserCheck size={16} />}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => deleteInstructor(inst.id, inst.nome)} className="h-10 px-4 rounded-xl">
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

      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-6">
           <Card className="w-full max-w-xl p-12 rounded-[4rem] shadow-3xl relative border-slate-800">
              <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-rose-500">
                <X size={40} />
              </button>
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-6">
                  <UserPlus size={40} />
                </div>
                <h3 className="text-3xl font-black uppercase text-slate-800 leading-none">Novo Docente</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nome Completo</label>
                  <input type="text" placeholder="NOME DO PROFESSOR..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-4 text-sm font-black uppercase outline-none focus:border-indigo-500" value={newDocente.nome} onChange={(e) => setNewDocente({...newDocente, nome: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Área</label>
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-4 py-4 text-xs font-black outline-none appearance-none uppercase" value={newDocente.area} onChange={(e) => setNewDocente({...newDocente, area: e.target.value as Area})}>
                      {Object.values(Area).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Contrato</label>
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-4 py-4 text-xs font-black outline-none appearance-none uppercase" value={newDocente.tipoContrato} onChange={(e) => setNewDocente({...newDocente, tipoContrato: e.target.value as TipoContrato})}>
                      <option value={TipoContrato.MENSALISTA}>MENSALISTA</option>
                      <option value={TipoContrato.HORISTA}>HORISTA</option>
                    </select>
                  </div>
                </div>
                <Button variant="primary" className="w-full h-16 rounded-[1.5rem] shadow-2xl text-xs uppercase font-black" onClick={handleAddDocente}>Confirmar Cadastro</Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};
