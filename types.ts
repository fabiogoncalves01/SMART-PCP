
export enum Turno {
  MANHA = 'Manhã',
  TARDE = 'Tarde',
  NOITE = 'Noite',
  UNMAPPED = 'Não Mapeado'
}

export enum TurnoTrabalho {
  MATUTINO = 'Matutino',
  MATUTINO_VESPERTINO = 'Matutino/Vespertino',
  VESPERTINO = 'Vespertino',
  VESPERTINO_NOTURNO = 'Vespertino/Noturno',
  NOTURNO = 'Noturno'
}

export enum Status {
  OK = 'OK',
  PENDENTE = 'Pendente',
  CONFLITO = 'Conflito',
  MULTI_TURMA = 'Multi-Turma',
  UNMAPPED_SHIFT = 'Turno Não Mapeado'
}

export enum Area {
  LOGISTICA = 'Logística',
  AUTOMACAO = 'Automação',
  MECANICA = 'Mecânica',
  TI = 'Tecnologia da Informação',
  ELETRICA = 'Elétrica',
  AUTOMOTIVA = 'Automotiva',
  NAO_DEFINIDA = 'Não Definida'
}

export enum TipoCurso {
  TECNICO = 'Habilitação Técnica',
  APRENDIZAGEM_BASICA = 'Aprendizagem Industrial Básica',
  APRENDIZAGEM_TECNICA = 'Aprendizagem Industrial Técnica',
  APERFEICOAMENTO = 'Aperfeiçoamento',
  QUALIFICACAO = 'Qualificação',
  INICIACAO = 'Iniciação Profissional'
}

export enum TipoContrato {
  HORISTA = 'HORISTA',
  MENSALISTA = 'MENSALISTA'
}

export enum ActivityCode {
  ATE = 'ATE', CEL = 'CEL', DDN = 'DDN', DDR = 'DDR', 
  FER = 'FER', IST = 'IST', NEM = 'NEM', OUT = 'OUT', 
  SEN = 'SEN', TD = 'T&D', PL = 'PL', PROJ = 'PROJ'
}

export interface UCMatriz {
  id: string;
  nome: string;
  ch: number;
}

export interface TurmaCurso {
  id: string;
  nome: string;
  area: Area;
  tipo: TipoCurso;
  duracaoMeses: number;
  dataInicio: string;
  dataFim: string;
  matriz: UCMatriz[];
  turno: Turno;
  horarioInicio: string; 
  horarioFim: string;    
  horaAula: number;      
}

export interface InstructorActivity {
  id: string;
  instructorId: string;
  date: string;
  code: ActivityCode;
  hours: number;
  turno: Turno;
}

export interface Instructor {
  id: string;
  nome: string;
  area: Area;
  areaExcel?: string;
  tipoContrato: TipoContrato;
  cargaSemanalHoras: number;
  status: 'Ativo' | 'Inativo';
  turnoTrabalho: TurnoTrabalho;
  affinityScore?: number; 
}

export interface Environment {
  id: string;
  nome: string;
  capacidade: number;
  tipo: 'SALA' | 'LABORATORIO' | 'OFICINA' | 'AUDITORIO';
  areaPrincipal: Area;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface CriticalEvent {
  id: string;
  date: string;
  title: string;
  type: 'CONSELHO' | 'VISITA' | 'REUNIAO' | 'FERIADO';
}

export interface Session {
  id: string;
  data: string;
  inicio: string;
  fim: string;
  turno: Turno;
  turmas: string[];
  instrutor: string | null;
  instrutorId?: string;
  ambiente: string | null;
  ambienteId?: string;
  unidadeCurricular: string;
  status: Status;
  conflitoDesc?: string;
  activityCode?: ActivityCode;
}

export interface MatrizTurno {
  id: string;
  inicioString: string;
  turno: Turno;
}

export type UserProfile = 'COORDINATION';
