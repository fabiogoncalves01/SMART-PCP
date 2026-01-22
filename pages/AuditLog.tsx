
import React, { useState } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { 
  History, Search, Filter, ArrowDownToLine, Trash2, 
  User, Activity, Clock, ShieldCheck, Database, Calendar
} from 'lucide-react';
import { AuditLog as AuditLogType } from '../types';

interface AuditLogProps {
  logs: AuditLogType[];
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportLogs = () => {
    const csv = [
      ["Data/Hora", "Usuário", "Ação", "Detalhes"],
      ...filteredLogs.map(l => [
        new Date(l.timestamp).toLocaleString('pt-BR'),
        l.user,
        l.action,
        l.details
      ])
    ].map(e => e.join(";")).join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_pcp_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'emerald';
    if (action.includes('IMPORTAÇÃO')) return 'indigo';
    if (action.includes('CADASTRO')) return 'amber';
    if (action.includes('ALOCAÇÃO')) return 'indigo';
    if (action.includes('ERRO')) return 'rose';
    return 'slate';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-white/10 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Histórico de Auditoria</h2>
            <p className="text-slate-400 text-sm font-medium">Rastreabilidade completa de todas as ações no sistema PCP.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <div className="relative min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar histórico..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Button variant="outline" className="h-12 border-white/10 text-white hover:bg-white/10" onClick={exportLogs}>
              <ArrowDownToLine size={18} /> Exportar CSV
           </Button>
        </div>
        <Database className="absolute -right-20 -bottom-20 text-white/5 w-64 h-64 rotate-12" />
      </header>

      <Card className="p-0 overflow-hidden shadow-2xl border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6">Usuário</th>
                <th className="px-10 py-6">Ação</th>
                <th className="px-10 py-6">Detalhes do Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center opacity-40">
                    <History size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum log encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-slate-300" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <Badge color={getActionColor(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-10 py-6">
                       <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{log.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
