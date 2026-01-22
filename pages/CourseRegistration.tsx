
import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { 
  BookOpen, Plus, Trash2, Save, Sparkles, 
  Calendar, Clock, Sunrise, Sun, Moon, Timer, Tags
} from 'lucide-react';
import { Area, TipoCurso, UCMatriz, TurmaCurso, Turno } from '../types';

interface CourseRegistrationProps {
  onSave: (turma: TurmaCurso) => void;
}

export const CourseRegistration: React.FC<CourseRegistrationProps> = ({ onSave }) => {
  const [nome, setNome] = useState('');
  const [area, setArea] = useState<Area>(Area.TI);
  const [tipo, setTipo] = useState<TipoCurso>(TipoCurso.TECNICO);
  const [turno, setTurno] = useState<Turno>(Turno.MANHA);
  const [dataInicio, setDataInicio] = useState('2026-02-01');
  const [dataFim, setDataFim] = useState('2026-12-15');
  const [horarioInicio, setHorarioInicio] = useState('07:30');
  const [horarioFim, setHorarioFim] = useState('11:30');
  const [horaAula, setHoraAula] = useState(50);
  
  const [ucNome, setUcNome] = useState('');
  const [ucCH, setUcCH] = useState(40);
  const [matriz, setMatriz] = useState<UCMatriz[]>([]);

  const addUC = () => {
    if (!ucNome) return;
    setMatriz([...matriz, { id: Math.random().toString(), nome: ucNome, ch: ucCH }]);
    setUcNome('');
    setUcCH(40);
  };

  const removeUC = (id: string) => {
    setMatriz(matriz.filter(u => u.id !== id));
  };

  const handleSave = () => {
    if (!nome) return;
    onSave({
      id: Math.random().toString(),
      nome,
      area,
      tipo,
      duracaoMeses: 10,
      dataInicio,
      dataFim,
      matriz,
      turno,
      horarioInicio,
      horarioFim,
      horaAula
    });
    setNome('');
    setMatriz([]);
    alert("Turma cadastrada com sucesso!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="bg-indigo-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-6">
            <Sparkles size={12} /> Configuração de Turma e Período
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 leading-none">Vigência e Matriz</h2>
          <p className="text-indigo-200 text-lg font-medium leading-relaxed">
            Defina o período letivo, turno, horários específicos e as unidades curriculares da turma.
          </p>
        </div>
        <BookOpen className="absolute -right-20 -bottom-20 text-indigo-800 w-96 h-96 opacity-30 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="p-10 border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">Identificação e Prazos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Nome da Turma</label>
                <input 
                  type="text" 
                  placeholder="Ex: AIT-DDS-6-B"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Área Técnica da Turma</label>
                <div className="relative">
                   <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <select 
                    value={area}
                    onChange={(e) => setArea(e.target.value as Area)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                   >
                     {Object.values(Area).map(a => <option key={a} value={a}>{a}</option>)}
                   </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Turno e Regime de Horário</label>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { id: Turno.MANHA, icon: <Sunrise size={18} /> },
                    { id: Turno.TARDE, icon: <Sun size={18} /> },
                    { id: Turno.NOITE, icon: <Moon size={18} /> }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTurno(t.id)}
                      className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 font-black text-xs uppercase transition-all ${
                        turno === t.id 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-200'
                      }`}
                    >
                      {t.icon} {t.id}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Início Aula</label>
                    <input 
                      type="time" 
                      value={horarioInicio}
                      onChange={(e) => setHorarioInicio(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-black dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fim Aula</label>
                    <input 
                      type="time" 
                      value={horarioFim}
                      onChange={(e) => setHorarioFim(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-black dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hora-Aula (min)</label>
                    <select 
                      value={horaAula}
                      onChange={(e) => setHoraAula(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-black appearance-none dark:text-white"
                    >
                      <option value={50}>50 min</option>
                      <option value={55}>55 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Data de Início</label>
                <input 
                  type="date" 
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Data de Término</label>
                <input 
                  type="date" 
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </Card>

          <Card className="p-10 border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">Matriz Curricular</h3>
            <div className="flex gap-4 mb-10">
              <input 
                type="text" 
                placeholder="Nome da Unidade Curricular"
                value={ucNome}
                onChange={(e) => setUcNome(e.target.value)}
                className="flex-[3] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-xs font-bold dark:text-white"
              />
              <input 
                type="number" 
                value={ucCH}
                onChange={(e) => setUcCH(Number(e.target.value))}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-xs font-bold dark:text-white"
              />
              <Button className="rounded-2xl h-[52px]" onClick={addUC}><Plus /></Button>
            </div>

            <div className="space-y-3">
              {matriz.map((uc) => (
                <div key={uc.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{uc.nome}</p>
                    <Badge color="indigo" className="mt-1">{uc.ch} HORAS</Badge>
                  </div>
                  <button onClick={() => removeUC(uc.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-slate-900 p-8 border-none text-white shadow-2xl sticky top-32">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Resumo da Turma</h4>
            <div className="space-y-6 mb-12">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Área Técnica</span>
                  <Badge color="indigo">{area}</Badge>
               </div>
               <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${nome ? 'bg-emerald-500' : 'bg-white/20'}`} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Identificação: {nome || 'Pendente'}</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${matriz.length > 0 ? 'bg-emerald-500' : 'bg-white/20'}`} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{matriz.length} Unidades Curriculares</span>
               </div>
               <div className="flex items-center gap-4 text-indigo-300">
                  <Timer size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{horarioInicio} - {horarioFim} ({horaAula}m)</span>
               </div>
            </div>
            <Button variant="primary" className="w-full h-16 rounded-2xl shadow-xl shadow-indigo-900/40" onClick={handleSave}>
              <Save size={20} /> Salvar Turma
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
