
import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { Search, Calculator, BarChart3, TrendingUp, Filter, ArrowUpRight, DoorOpen, Users, Info, AlertTriangle, MapPin } from 'lucide-react';
import { Instructor, Area, Session, Turno } from '../types';

interface OccupationProps {
  type: 'instructor' | 'area' | 'environment';
  sessions: Session[];
  instructors: Instructor[];
  customWorkingDays: Record<number, number>;
}

export const Occupation: React.FC<OccupationProps> = ({ type, sessions, instructors, customWorkingDays }) => {
  const [filterMes, setFilterMes] = useState<number>(new Date().getMonth());
  const [filterTurno, setFilterTurno] = useState<Turno | 'TODOS'>('TODOS');
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const getWorkingDays = (month: number, year: number = 2026) => {
    // Prioriza o valor customizado se existir
    if (customWorkingDays[month] !== undefined) return customWorkingDays[month];
    
    let count = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) count++;
      date.setDate(date.getDate() + 1);
    }
    return count;
  };

  const stats = useMemo(() => {
    const disp = getWorkingDays(filterMes);
    
    if (type === 'environment') {
      const uniqueEnvs = new Set<string>();
      
      sessions.forEach(s => {
        const amb = (s.ambiente || "").trim();
        const ambUpper = amb.toUpperCase();
        if (!amb || amb === "SALA PENDENTE") return;
        if (ambUpper.includes("(CH:")) return;
        const isLocation = /SALA|LAB|VTRIA|BLOCO|AUDIT|OFIC|BOX|QUADRA|TI|LABORATÓRIO/i.test(ambUpper);
        const hasNumbers = /\d/.test(ambUpper);
        if (isLocation || hasNumbers) uniqueEnvs.add(amb.toUpperCase());
      });

      return Array.from(uniqueEnvs).map(envName => {
        const envSessions = sessions.filter(s => {
          const dateParts = s.data.split('-');
          if (dateParts.length < 2) return false;
          const m = parseInt(dateParts[1]) - 1;
          return m === filterMes && 
                 (filterTurno === 'TODOS' || s.turno === filterTurno) && 
                 (s.ambiente || "").trim().toUpperCase() === envName;
        });

        const distinctDays = new Set(envSessions.map(s => s.data)).size;
        
        return { 
          id: `env-${envName}`, 
          nome: envName,
          area: 'INFRAESTRUTURA', 
          diasOcupados: distinctDays, 
          diasDisponiveis: disp, 
          ocupacao: disp > 0 ? (distinctDays / disp) * 100 : 0 
        };
      }).sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return instructors.map(inst => {
      const instSessions = sessions.filter(s => {
        const dateParts = s.data.split('-');
        if (dateParts.length < 2) return false;
        const m = parseInt(dateParts[1]) - 1;
        const isSame = s.instrutorId === inst.id || (s.instrutor && s.instrutor.toUpperCase() === inst.nome.toUpperCase());
        return m === filterMes && (filterTurno === 'TODOS' || s.turno === filterTurno) && isSame;
      });

      const distinctDays = new Set(instSessions.map(s => s.data)).size;
      return { 
        ...inst, 
        diasOcupados: distinctDays, 
        diasDisponiveis: disp, 
        ocupacao: disp > 0 ? (distinctDays / disp) * 100 : 0 
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [instructors, sessions, filterMes, filterTurno, type, customWorkingDays]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Mês Analisado</label>
          <select value={filterMes} onChange={(e) => setFilterMes(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all">
            {meses.map((m, i) => <option key={i} value={i}>{m} 2026</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Turno</label>
          <select value={filterTurno} onChange={(e) => setFilterTurno(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all">
            <option value="TODOS">Todos</option>
            <option value={Turno.MANHA}>Manhã</option>
            <option value={Turno.TARDE}>Tarde</option>
            <option value={Turno.NOITE}>Noite</option>
          </select>
        </div>
        <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${customWorkingDays[filterMes] !== undefined ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
           {customWorkingDays[filterMes] !== undefined ? <Calculator size={18} className="text-indigo-600" /> : <Info size={18} className="text-slate-400" />}
           <div>
             <p className={`text-[9px] font-black uppercase leading-none ${customWorkingDays[filterMes] !== undefined ? 'text-indigo-900' : 'text-slate-400'}`}>
               {customWorkingDays[filterMes] !== undefined ? 'Referência Manual' : 'Referência Auto'}
             </p>
             <p className={`text-xs font-bold mt-1 ${customWorkingDays[filterMes] !== undefined ? 'text-indigo-700' : 'text-slate-700'}`}>
               {getWorkingDays(filterMes)} dias úteis
             </p>
           </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-2xl rounded-[2.5rem] border-slate-200 dark:border-slate-800">
        <div className="px-10 py-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-5">
             <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl ${type === 'environment' ? 'bg-amber-500' : 'bg-slate-900 dark:bg-indigo-600'}`}>
               {type === 'environment' ? <DoorOpen size={28} /> : <Users size={28} />}
             </div>
             <div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                 {type === 'environment' ? 'Gestão de Ambientes' : 'Ocupação de Recursos'}
               </h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sincronizado com Dias Úteis PCP</p>
             </div>
           </div>
           <Badge color={type === 'environment' ? 'amber' : 'indigo'}>{stats.length} itens</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <th className="px-10 py-6">Identificação</th>
                 <th className="px-10 py-6">Categoria</th>
                 <th className="px-10 py-6 text-center">Uso Mensal</th>
                 <th className="px-10 py-6">Saturação</th>
                 <th className="px-10 py-6 text-right">Ação</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {stats.map(s => (
                <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${type === 'environment' ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 dark:bg-indigo-600 text-white'}`}>
                         {type === 'environment' ? <MapPin size={18} /> : s.nome.substring(0,2).toUpperCase()}
                       </div>
                       <span className="font-black text-slate-800 dark:text-white uppercase text-xs">{s.nome}</span>
                     </div>
                  </td>
                  <td className="px-10 py-6">
                     <Badge color={type === 'environment' ? 'amber' : 'indigo'}>
                       {type === 'environment' ? 'AMBIENTE FÍSICO' : s.area}
                     </Badge>
                  </td>
                  <td className="px-10 py-6 text-center">
                     <span className="font-black text-xs">{s.diasOcupados} / {s.diasDisponiveis}d</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 min-w-[120px]">
                         <div 
                           className={`h-full transition-all duration-700 ${s.ocupacao > 85 ? 'bg-rose-500' : s.ocupacao > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                           style={{ width: `${Math.min(s.ocupacao, 100)}%` }} 
                         />
                       </div>
                       <span className="text-[11px] font-black w-10 text-slate-700 dark:text-slate-300">{Math.round(s.ocupacao)}%</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                     <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">Analisar <ArrowUpRight size={14}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
