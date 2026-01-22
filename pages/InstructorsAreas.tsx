
import React, { useState } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { 
  Search, Users, Tag, ChevronDown, CheckSquare, Square, Save, X, Briefcase, AlertCircle
} from 'lucide-react';
import { Instructor, Area } from '../types';

interface InstructorsAreasProps {
  instructors: Instructor[];
  setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
}

export const InstructorsAreas: React.FC<InstructorsAreasProps> = ({ instructors, setInstructors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = instructors.filter(i => 
    i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar docente para mapeamento de áreas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-black uppercase tracking-tight"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="h-14 px-6 rounded-2xl" onClick={() => {
            if (selectedIds.length === filtered.length) setSelectedIds([]);
            else setSelectedIds(filtered.map(i => i.id));
          }}>
            Selecionar Todos
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden rounded-[3rem] shadow-2xl border-slate-100 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-10 py-8 w-10 text-center">Sel.</th>
                <th className="px-10 py-8">Docente / Contrato</th>
                <th className="px-10 py-8">Área de Atuação Operacional</th>
                <th className="px-10 py-8 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map((inst) => (
                <tr key={inst.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group ${inst.status === 'Inativo' ? 'bg-slate-50/50 opacity-60 grayscale' : ''}`}>
                  <td className="px-10 py-6 text-center">
                    <button onClick={() => setSelectedIds(prev => prev.includes(inst.id) ? prev.filter(x => x !== inst.id) : [...prev, inst.id])}>
                      {selectedIds.includes(inst.id) ? <CheckSquare className="text-indigo-600" size={22} /> : <Square className="text-slate-200" size={22} />}
                    </button>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${inst.status === 'Ativo' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                        {inst.nome.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-white tracking-tighter uppercase">{inst.nome}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{inst.tipoContrato} • {inst.turnoTrabalho}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <Tag size={14} className="text-indigo-400" />
                      <select 
                        value={inst.area}
                        onChange={(e) => setInstructors(prev => prev.map(i => i.id === inst.id ? { ...i, area: e.target.value as Area } : i))}
                        className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        {Object.values(Area).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100"><Save size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* AlertCircle imported above to fix missing reference error */}
      <div className="flex items-start gap-4 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800">
         <AlertCircle className="text-indigo-600" size={24} />
         <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase leading-relaxed tracking-tighter">
           As áreas definidas aqui são utilizadas pelo Otimizador IA e pelo Pendenciômetro para sugerir substituições e alocações tecnicamente compatíveis.
         </p>
      </div>
    </div>
  );
};
