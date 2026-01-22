
import React, { useState } from 'react';
import { 
  FileUp, Loader2, Table, AlertTriangle, Check, CloudUpload, HardDrive, History, FileText, Trash2
} from 'lucide-react';
import { Button, Card } from '../components/UI';
import { Session, Instructor, Status, Turno, Area, TipoContrato, TurnoTrabalho, MatrizTurno } from '../types';

const sanitizeText = (str: string) => {
  if (!str) return "";
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str
      .replace(/Ã£/g, 'ã')
      .replace(/Ãµ/g, 'õ')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã§/g, 'ç')
      .replace(/Â/g, '')
      .replace(/‡/g, 'ç')
      .replace(/‰/g, 'É')
      .trim();
  }
};

const slugify = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]/g, "")
     .trim();

const normalizeToISO = (dateStr: string): string => {
  if (!dateStr) return "";
  const clean = dateStr.replace(/"/g, '').trim();
  let d, m, y;
  if (clean.includes('/')) {
    [d, m, y] = clean.split('/').map(Number);
  } else if (clean.includes('-')) {
    const parts = clean.split('-').map(Number);
    if (parts[0] > 1000) [y, m, d] = parts; 
    else [d, m, y] = parts; 
  } else return clean;
  if (y < 100) y += 2000;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const getTurnoByTime = (timeStr: string): Turno => {
  if (!timeStr || !timeStr.includes(':')) return Turno.UNMAPPED;
  const h = parseInt(timeStr.split(':')[0]);
  if (h >= 5 && h < 12) return Turno.MANHA;
  if (h >= 12 && h < 18) return Turno.TARDE;
  if (h >= 18 && h <= 23) return Turno.NOITE;
  return Turno.UNMAPPED;
};

interface ImportWizardProps {
  onComplete: (s: Session[], i: Instructor[], name: string) => void;
  history: any[];
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onComplete, history }) => {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [parsedSessions, setParsedSessions] = useState<Session[]>([]);
  const [parsedInstructors, setParsedInstructors] = useState<Instructor[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const processCSV = (text: string, fileName: string) => {
    const sanitizedFullText = sanitizeText(text);
    const lines = sanitizedFullText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return;
    
    const delimiter = lines[0].includes(';') ? ';' : ',';
    
    // MAPEAMENTO RÍGIDO DO CSV SENAI:
    const idx = {
      data: 0,
      inicio: 2,
      turma: 4,
      instrutor: 5,
      uc: 6,
      ambiente: 7
    };

    const tempSessions: Session[] = [];
    const instructorsMap = new Map<string, Instructor>();

    lines.slice(1).forEach((row, rowIndex) => {
      const cols = row.split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 7) return;
      
      const rawData = normalizeToISO(cols[idx.data] || "");
      const formattedInicio = (cols[idx.inicio] || "").split(' ')[0] || "--:--";
      
      const instrutorNome = cols[idx.instrutor] || "";
      const instId = `inst-${slugify(instrutorNome || "pendente")}`;
      const ucNome = cols[idx.uc] || "UC PENDENTE";

      // Lógica Estrita de Ambiente: Se a coluna 7 for igual a 6 ou estiver vazia, é pendência.
      const rawAmbiente = cols[idx.ambiente] || "";
      let ambienteFinal = rawAmbiente.trim();
      
      if (!ambienteFinal || ambienteFinal === ucNome) {
        ambienteFinal = "SALA PENDENTE";
      }

      if (instrutorNome && !instructorsMap.has(instId)) {
        instructorsMap.set(instId, {
          id: instId,
          nome: instrutorNome,
          area: Area.NAO_DEFINIDA,
          tipoContrato: TipoContrato.MENSALISTA,
          cargaSemanalHoras: 40,
          status: 'Ativo',
          turnoTrabalho: TurnoTrabalho.MATUTINO_VESPERTINO
        });
      }

      tempSessions.push({
        id: `sess-${rowIndex}-${Date.now()}`,
        data: rawData,
        inicio: formattedInicio,
        fim: "",
        turno: getTurnoByTime(formattedInicio),
        turmas: [cols[idx.turma] || "S/ TURMA"],
        instrutor: instrutorNome || null,
        instrutorId: instId,
        ambiente: ambienteFinal,
        unidadeCurricular: ucNome,
        status: (instrutorNome && ambienteFinal !== "SALA PENDENTE") ? Status.OK : Status.PENDENTE
      });
    });

    setParsedSessions(tempSessions);
    setParsedInstructors(Array.from(instructorsMap.values()));
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        processCSV(event.target?.result as string, file.name);
        setUploading(false);
      };
      reader.readAsText(file, 'ISO-8859-1');
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onComplete(parsedSessions, parsedInstructors, selectedFile.name);
      setStep(1);
      setSelectedFile(null);
      window.location.hash = '/dashboard';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <Card className="p-10 border-slate-200 shadow-xl rounded-[3rem] dark:bg-slate-900 dark:border-slate-800">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                {uploading ? <Loader2 size={40} className="animate-spin" /> : <CloudUpload size={40} />}
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Nova Importação</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Suba um novo CSV para complementar ou atualizar a grade operacional.</p>
            </div>

            <label className="block w-full border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-12 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group relative overflow-hidden">
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
              <div className="relative z-10">
                <Table className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-4 transition-colors" size={40} />
                <p className="text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest text-center">Clique para selecionar <br/>o arquivo operacional</p>
              </div>
            </label>
          </Card>

          {step === 2 && (
            <Card className="p-10 border-indigo-200 bg-indigo-50/30 dark:bg-indigo-900/10 dark:border-indigo-900/30 animate-in slide-in-from-bottom-4 duration-500 rounded-[3rem]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Arquivo Detectado</h4>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase mt-1 tracking-widest">{selectedFile?.name}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30 font-black text-indigo-600 dark:text-indigo-400 text-xs">
                  {parsedSessions.length} Aulas
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 h-14" onClick={() => setStep(1)}>Cancelar</Button>
                <Button className="flex-[2] h-14 shadow-lg shadow-indigo-100" onClick={handleConfirm}>Confirmar e Mesclar</Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <History size={24} className="text-slate-400" />
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Histórico de Versões</h3>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
            {history.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] opacity-40">
                <FileText size={48} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma importação realizada</p>
              </div>
            ) : (
              history.map((h) => (
                <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-center justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center text-indigo-500">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{h.name}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h.date}</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{h.count} Registros</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
