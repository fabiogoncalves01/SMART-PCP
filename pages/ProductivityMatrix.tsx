
import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { Search, Calculator, TrendingUp, Printer, Info, FileDown, UserX } from 'lucide-react';
import { Instructor, Area, Session, Turno, TurnoTrabalho } from '../types';

interface ProductivityMatrixProps {
  sessions: Session[];
  instructors: Instructor[];
  customWorkingDays: Record<number, number>;
}

export const ProductivityMatrix: React.FC<ProductivityMatrixProps> = ({ sessions, instructors, customWorkingDays }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<Area | 'TODOS'>('TODOS');
  
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const turnosParaMatrix = [Turno.MANHA, Turno.TARDE, Turno.NOITE];

  const getWorkingDays = (month: number, year: number = 2026) => {
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

  const workingDaysPerMonth = useMemo(() => 
    meses.map((_, i) => getWorkingDays(i)), [customWorkingDays]
  );

  // Helper para verificar se o turno de referência deve aparecer para o contrato do instrutor
  const isTurnoVisibleForContract = (contrato: TurnoTrabalho, turnoRef: Turno) => {
    const c = contrato.toUpperCase();
    if (turnoRef === Turno.MANHA) return c.includes('MATUTINO') || c.includes('MANHÃ');
    if (turnoRef === Turno.TARDE) return c.includes('VESPERTINO') || c.includes('TARDE');
    if (turnoRef === Turno.NOITE) return c.includes('NOTURNO') || c.includes('NOITE');
    return false;
  };

  const instructorProductivityByTurno = useMemo(() => {
    const matrixData: any[] = [];
    
    // Filtra apenas instrutores ativos para a matriz de produtividade
    const activeInstructors = instructors.filter(i => i.status === 'Ativo');

    activeInstructors.forEach(inst => {
      turnosParaMatrix.forEach(turnoRef => {
        // Cálculo da produtividade mensal
        const monthlyData = meses.map((_, monthIdx) => {
          const instSessionsInTurno = sessions.filter(s => {
            const dateParts = s.data.split('-');
            if (dateParts.length < 2) return false;
            const m = parseInt(dateParts[1]) - 1;
            const isSameInst = s.instrutorId === inst.id || (s.instrutor && s.instrutor.toUpperCase() === inst.nome.toUpperCase());
            return m === monthIdx && isSameInst && s.turno === turnoRef;
          });
          const distinctDays = new Set(instSessionsInTurno.map(s => s.data)).size;
          const totalDisp = workingDaysPerMonth[monthIdx];
          const perc = totalDisp > 0 ? (distinctDays / totalDisp) * 100 : 0;
          return Math.round(perc);
        });

        const hasAnyOccupation = monthlyData.some(v => v > 0);
        const isContractedForThisTurno = isTurnoVisibleForContract(inst.turnoTrabalho, turnoRef);

        // REGRA: Mostra se tem aula OU se o contrato prevê trabalho nesse turno (mesmo com 0%)
        if (hasAnyOccupation || isContractedForThisTurno) {
          matrixData.push({
            id: inst.id,
            nome: inst.nome,
            area: inst.area,
            turnoRef,
            productivity: monthlyData,
            isOcioso: !hasAnyOccupation
          });
        }
      });
    });

    return matrixData.filter(item => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = selectedArea === 'TODOS' || item.area === selectedArea;
      return matchesSearch && matchesArea;
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [instructors, sessions, searchTerm, selectedArea, workingDaysPerMonth]);

  const getCellColor = (value: number) => {
    if (value === 0) return 'bg-rose-50/50 dark:bg-rose-900/10 text-rose-400 border-rose-100/30';
    if (value > 0 && value <= 80) return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-black';
    return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-black';
  };

  const handlePrint = () => {
    setTimeout(() => { window.print(); }, 200);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Docente", "Turno", ...meses],
      ...instructorProductivityByTurno.map(item => [
        item.nome,
        item.turnoRef,
        ...item.productivity.map((v: number) => `${v}%`)
      ])
    ].map(row => row.join(";")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `produtividade_pcp_2026.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" id="matrix-content">
      <style>{`
        @media print {
          @page { size: landscape; margin: 0.5cm; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-container { border: 1px solid #e2e8f0 !important; width: 100% !important; border-radius: 0 !important; }
          table { font-size: 7pt !important; width: 100% !important; border-collapse: collapse !important; }
          th, td { padding: 2px 4px !important; border: 0.5px solid #cbd5e1 !important; }
          .bg-rose-50 { background-color: #fff1f2 !important; }
          .bg-amber-100 { background-color: #fef3c7 !important; }
          .bg-emerald-100 { background-color: #d1fae5 !important; }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-8 no-print">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <TrendingUp size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Matriz de Produtividade</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Base Cadastral Integral ({instructors.length} Docentes)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:min-w-[250px]">
            <input 
              type="text" 
              placeholder="Buscar na base..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-indigo-500 transition-all dark:text-white uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="h-[52px] rounded-2xl px-6 border-2 border-slate-100" onClick={handleExportCSV}>
              <FileDown size={18} /> <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button variant="secondary" className="h-[52px] rounded-2xl px-6 border-2 border-slate-100" onClick={handlePrint}>
              <Printer size={18} /> <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-2xl border-slate-100 dark:border-slate-800 rounded-[2.5rem] print-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 dark:bg-black text-white">
                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-widest sticky left-0 z-20 bg-slate-900 dark:bg-black border-r border-white/5 w-[250px]">Docente</th>
                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-widest border-r border-white/5 w-[100px]">Turno</th>
                {meses.map(m => (
                  <th key={m} className="px-2 py-6 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/5 min-w-[65px]">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {instructorProductivityByTurno.length === 0 ? (
                <tr>
                   <td colSpan={14} className="py-20 text-center opacity-30">
                      <UserX size={48} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum docente encontrado nos critérios</p>
                   </td>
                </tr>
              ) : (
                instructorProductivityByTurno.map((item, idx) => (
                  <tr key={`${item.id}-${item.turnoRef}`} className={`group transition-colors ${item.isOcioso ? 'bg-rose-50/5' : ''}`}>
                    <td className="px-6 py-5 text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                         {item.isOcioso && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" title="Sem aulas lançadas" />}
                         {item.nome}
                      </div>
                    </td>
                    <td className={`px-6 py-5 text-[9px] font-black uppercase tracking-widest border-r border-slate-100 dark:border-slate-800 ${
                      item.turnoRef === Turno.MANHA ? 'text-amber-600' : 
                      item.turnoRef === Turno.TARDE ? 'text-orange-600' : 
                      'text-indigo-600'
                    }`}>
                      {item.turnoRef}
                    </td>
                    {item.productivity.map((val, mIdx) => (
                      <td 
                        key={mIdx} 
                        className={`px-2 py-5 text-[11px] text-center border-r border-slate-100 dark:border-slate-800 last:border-0 ${getCellColor(val)}`}
                      >
                        {val}%
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="no-print bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
        <Info className="text-indigo-600 shrink-0 mt-1" size={20} />
        <div className="space-y-2">
          <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase leading-relaxed tracking-widest">
            A matriz exibe todos os instrutores da base para o turno previsto em contrato. 
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-rose-50 border border-rose-100" />
               <span className="text-[8px] font-black text-slate-500 uppercase">0% (Ocioso)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-amber-50 border border-amber-100" />
               <span className="text-[8px] font-black text-slate-500 uppercase">1-80% (Regular)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100" />
               <span className="text-[8px] font-black text-slate-500 uppercase">&gt;80% (Saturado)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
