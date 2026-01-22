
import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { 
  FileUp, 
  FileDown, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Loader2
} from 'lucide-react';

export const ImportExport: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleUpload = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Steps Indicator */}
      <div className="flex justify-between items-center relative px-2">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0" />
        {[1, 2, 3].map(s => (
          <div 
            key={s} 
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 border-2 transition-all ${
              step >= s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            {step > s ? <CheckCircle2 size={16} /> : s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="text-center py-12">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileUp size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Importar Dados do Excel</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-8">
            Faça upload da sua planilha para atualizar sessões, instrutores ou ambientes em lote.
          </p>
          
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 bg-slate-50 mb-6 cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all">
            <input type="file" className="hidden" id="excel-upload" />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <span className="text-indigo-600 font-bold">Clique para selecionar</span> ou arraste o arquivo aqui
              <p className="text-xs text-slate-400 mt-1">Formatos aceitos: .xlsx, .csv (Máx. 10MB)</p>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="gap-2">
              <FileDown size={18} />
              Baixar Template
            </Button>
            <Button onClick={handleUpload} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
              Continuar Processamento
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Pré-visualização e Mapeamento">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6 flex gap-3">
            <Info size={18} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800">Detectamos 148 registros na planilha. Por favor, confirme o mapeamento das colunas abaixo antes de prosseguir.</p>
          </div>

          <div className="space-y-4 mb-8">
            {[
              { col: 'Coluna Planilha', map: 'Campo do Sistema' },
              { col: 'ID_TURMA', map: 'Turma (ID)' },
              { col: 'DOCENTE_NOME', map: 'Instrutor' },
              { col: 'DATA_SESSAO', map: 'Data' },
              { col: 'BLOCO_REF', map: 'Bloco de Horário' },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? 'bg-slate-100 font-bold text-xs uppercase' : 'border-b border-slate-100 text-sm'}`}>
                <span>{row.col}</span>
                <ArrowRight size={14} className="text-slate-300" />
                <span className={i === 0 ? '' : 'text-indigo-600 font-semibold'}>{row.map}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={handleFinish} disabled={loading} className="gap-2">
               {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Confirmar Importação
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="text-center py-10">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Importação Concluída!</h3>
          <p className="text-slate-500 mt-2 mb-8">142 registros importados com sucesso. 6 avisos encontrados.</p>
          
          <div className="max-w-md mx-auto bg-slate-50 rounded-lg p-4 text-left mb-8 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Logs de Erros/Avisos</p>
            <div className="space-y-2">
              <div className="flex gap-2 text-[11px] text-rose-600">
                <AlertCircle size={14} />
                <span>Linha 42: Ambiente "Lab Z" não encontrado no sistema.</span>
              </div>
              <div className="flex gap-2 text-[11px] text-amber-600">
                <AlertCircle size={14} />
                <span>Linha 89: Instrutor "João Silva" já possui aula no mesmo período.</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>Nova Importação</Button>
            <Button onClick={() => window.location.hash = '/agenda'}>Ver Agenda</Button>
          </div>
        </Card>
      )}
    </div>
  );
};
