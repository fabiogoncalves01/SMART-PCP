
import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { 
  DoorOpen, Plus, Trash2, Search, MapPin, Users, 
  Info, AlertTriangle, Filter, Save, LayoutGrid, Box, Cpu, Hammer
} from 'lucide-react';
import { Environment, Area, Session } from '../types';

interface EnvironmentManagementProps {
  environments: Environment[];
  setEnvironments: React.Dispatch<React.SetStateAction<Environment[]>>;
  sessions: Session[];
}

export const EnvironmentManagement: React.FC<EnvironmentManagementProps> = ({ environments, setEnvironments, sessions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEnv, setNewEnv] = useState<Partial<Environment>>({
    nome: '',
    capacidade: 40,
    tipo: 'SALA',
    areaPrincipal: Area.NAO_DEFINIDA
  });

  const filteredEnvs = useMemo(() => {
    return environments.filter(e => 
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.areaPrincipal.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [environments, searchTerm]);

  const handleAdd = () => {
    if (!newEnv.nome) return;
    const env: Environment = {
      id: `env-${Date.now()}`,
      nome: newEnv.nome,
      capacidade: newEnv.capacidade || 40,
      tipo: newEnv.tipo as any,
      areaPrincipal: newEnv.areaPrincipal as Area
    };
    setEnvironments([...environments, env]);
    setShowAddModal(false);
    setNewEnv({ nome: '', capacidade: 40, tipo: 'SALA', areaPrincipal: Area.NAO_DEFINIDA });
  };

  const removeEnv = (id: string) => {
    if (confirm("Deseja remover este ambiente?")) {
      setEnvironments(prev => prev.filter(e => e.id !== id));
    }
  };

  const getEnvIcon = (tipo: string) => {
    switch (tipo) {
      case 'LABORATORIO': return <Cpu size={20} />;
      case 'OFICINA': return <Hammer size={20} />;
      default: return <DoorOpen size={20} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <DoorOpen size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Gestão de Infraestrutura</h2>
            <p className="text-slate-400 text-sm font-medium">Controle salas, laboratórios e capacidade física instalada.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <Button variant="primary" className="h-14 bg-amber-500 hover:bg-amber-600 rounded-2xl px-8" onClick={() => setShowAddModal(true)}>
              <Plus size={20} /> Novo Ambiente
           </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou área..."
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-14 pr-6 py-4 text-sm font-black outline-none focus:border-amber-500 transition-all dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEnvs.map(env => (
          <Card key={env.id} className="p-8 rounded-[2.5rem] group hover:border-amber-400 transition-all border-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${env.tipo === 'LABORATORIO' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
                {getEnvIcon(env.tipo)}
              </div>
              <Badge color={env.tipo === 'LABORATORIO' ? 'indigo' : 'amber'}>{env.tipo}</Badge>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">{env.nome}</h3>
            <div className="space-y-3 mb-6">
               <div className="flex items-center gap-2 text-slate-500">
                  <Users size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Capacidade: {env.capacidade} alunos</span>
               </div>
               <div className="flex items-center gap-2 text-slate-500">
                  <Box size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Área: {env.areaPrincipal}</span>
               </div>
            </div>
            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
               <Button variant="ghost" size="sm" onClick={() => removeEnv(env.id)} className="text-slate-300 hover:text-rose-500">
                  <Trash2 size={16} />
               </Button>
               <Button variant="secondary" size="sm" className="rounded-xl">Visualizar Ocupação</Button>
            </div>
          </Card>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
           <Card className="w-full max-w-xl p-10 rounded-[3rem] shadow-3xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Novo Recurso Físico</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-rose-500"><Plus size={32} className="rotate-45" /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome do Ambiente</label>
                    <input type="text" placeholder="Ex: Laboratório de Informática 01" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-amber-500" value={newEnv.nome} onChange={(e) => setNewEnv({...newEnv, nome: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Capacidade (Alunos)</label>
                       <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-amber-500" value={newEnv.capacidade} onChange={(e) => setNewEnv({...newEnv, capacidade: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo</label>
                       <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-amber-500" value={newEnv.tipo} onChange={(e) => setNewEnv({...newEnv, tipo: e.target.value as any})}>
                          <option value="SALA">Sala de Aula</option>
                          <option value="LABORATORIO">Laboratório</option>
                          <option value="OFICINA">Oficina</option>
                          <option value="AUDITORIO">Auditório</option>
                       </select>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Área Principal</label>
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-amber-500" value={newEnv.areaPrincipal} onChange={(e) => setNewEnv({...newEnv, areaPrincipal: e.target.value as any})}>
                       {Object.values(Area).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                 </div>
                 <Button variant="primary" className="w-full h-16 bg-amber-500 hover:bg-amber-600 rounded-2xl shadow-xl shadow-amber-500/20 mt-6" onClick={handleAdd}>Criar Ambiente</Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};
