
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { 
  Settings as SettingsIcon, Clock, CalendarDays, Plus, Trash2, 
  Save, AlertCircle, Info, Calendar as CalendarIcon, Check, RefreshCw
} from 'lucide-react';
import { MatrizTurno, Turno } from '../types';

interface SettingsProps {
  matrizTurno: MatrizTurno[];
  setMatrizTurno: React.Dispatch<React.SetStateAction<MatrizTurno[]>>;
  customWorkingDays: Record<number, number>;
  setCustomWorkingDays: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  matrizTurno, setMatrizTurno, customWorkingDays, setCustomWorkingDays 
}) => {
  const [newInicio, setNewInicio] = useState('');
  const [newTurno, setNewTurno] = useState<Turno>(Turno.MANHA);
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const getAutoWorkingDays = (month: number, year: number = 2026) => {
    let count = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) count++;
      date.setDate(date.getDate() + 1);
    }
    return count;
  };

  const addMatriz = () => {
    if (!newInicio) return;
    setMatrizTurno(prev => [...prev, { id: Math.random().toString(), inicioString: newInicio, turno: newTurno }]);
    setNewInicio('');
  };

  const removeMatriz = (id: string) => {
    setMatrizTurno(prev => prev.filter(m => m.id !== id));
  };

  const updateWorkingDays = (monthIdx: number, val: string) => {
    const num = parseInt(val);
    setCustomWorkingDays(prev => {
      const next = { ...prev };
      if (isNaN(num)) delete next[monthIdx];
      else next[monthIdx] = num;
      return next;
    });
  };

  const resetWorkingDays = () => {
    if (confirm("Deseja resetar todas as alterações manuais de dias úteis?")) {
      setCustomWorkingDays({});
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <SettingsIcon size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Configurações do Sistema</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Parâmetros de cálculo e regras de negócio</p>
          </div>
        </div>
        <Button variant="primary" className="h-14 px-8 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none"><Save size={18}/> Salvar Tudo</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gestão de Dias Úteis Manual */}
        <Card title="Gestão de Dias Úteis (Manual)" className="shadow-2xl rounded-[2.5rem]">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <CalendarIcon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Calendário 2026</span>
              </div>
              <button 
                onClick={resetWorkingDays}
                className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
              >
                <RefreshCw size={14} /> Resetar Auto
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {meses.map((mes, idx) => {
                const auto = getAutoWorkingDays(idx);
                const custom = customWorkingDays[idx];
                const isCustom = custom !== undefined;

                return (
                  <div key={idx} className={`p-4 rounded-2xl border transition-all ${isCustom ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-2">{mes}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={isCustom ? custom : auto}
                        onChange={(e) => updateWorkingDays(idx, e.target.value)}
                        className={`w-full bg-white border-2 rounded-xl px-3 py-2 text-sm font-black outline-none transition-all ${isCustom ? 'border-indigo-400 text-indigo-600' : 'border-slate-100 text-slate-700'}`}
                      />
                      {isCustom && <Check size={14} className="text-indigo-500 shrink-0" />}
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Auto: {auto} dias</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-4 mt-4">
              <Info size={18} className="text-amber-500 shrink-0 mt-1" />
              <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase leading-relaxed tracking-tighter">
                Valores informados manualmente sobrescrevem o cálculo automático (Seg-Sex) em todos os relatórios de ocupação e produtividade.
              </p>
            </div>
          </div>
        </Card>

        {/* Matriz de Turnos */}
        <div className="space-y-10">
          <Card title="Matriz de Lookup de Turnos (Excel)" className="p-0 overflow-hidden shadow-2xl rounded-[2.5rem]">
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex gap-4">
               <input 
                 type="text" placeholder="Horário Texto (Ex: 07:30 08:25...)"
                 className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                 value={newInicio} onChange={(e) => setNewInicio(e.target.value)}
               />
               <select 
                 className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-black uppercase"
                 value={newTurno} onChange={(e) => setNewTurno(e.target.value as Turno)}
               >
                 <option value={Turno.MANHA}>Manhã</option>
                 <option value={Turno.TARDE}>Tarde</option>
                 <option value={Turno.NOITE}>Noite</option>
               </select>
               <Button variant="primary" size="sm" onClick={addMatriz}><Plus size={16}/></Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar divide-y divide-slate-50 dark:divide-slate-800">
              {matrizTurno.map(m => (
                <div key={m.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400"><Clock size={16} /></div>
                    <div>
                      <p className="text-[10px] font-mono font-black text-slate-800 dark:text-slate-200 leading-none mb-1">{m.inicioString}</p>
                      <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{m.turno}</span>
                    </div>
                  </div>
                  <button onClick={() => removeMatriz(m.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-900 p-10 border-none text-white shadow-3xl overflow-hidden relative rounded-[2.5rem]">
             <div className="relative z-10 flex items-start gap-8">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-white/10 shadow-inner">
                  <RefreshCw size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-none">Automação Inteligente</h3>
                  <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-sm">
                    O sistema recalcula a produtividade em tempo real assim que um novo dia útil é informado.
                  </p>
                </div>
             </div>
             <CalendarDays className="absolute -right-20 -bottom-20 text-white/5 w-64 h-64 opacity-30 rotate-12" />
          </Card>
        </div>
      </div>
    </div>
  );
};
