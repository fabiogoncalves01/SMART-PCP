
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Agenda } from './pages/Agenda';
import { Occupation } from './pages/Occupation';
import { Pendencies } from './pages/Pendencies';
import { CourseRegistration } from './pages/CourseRegistration';
import { SchedulePlanner } from './pages/SchedulePlanner';
import { ImportWizard } from './pages/ImportWizard';
import { InstructorsAreas } from './pages/InstructorsAreas';
import { ContractCapacity } from './pages/ContractCapacity';
import { EnvironmentManagement } from './pages/EnvironmentManagement';
import { ProductivityMatrix } from './pages/ProductivityMatrix';
import { AuditLog } from './pages/AuditLog';
import { Settings } from './pages/Settings';
import { 
  Session, Instructor, TurmaCurso, AuditLog as AuditLogType, 
  InstructorActivity, UserProfile, Area, TipoContrato, TurnoTrabalho, MatrizTurno
} from './types';
import { INITIAL_MATRIZ_TURNO } from './constants';

const INITIAL_NAMES = [
  "ALFREDO DE SOUZA SILVEIRA", "ALVIMAR DOS REIS VENTUROTI", "AMINTA DEL VALLE MANZANILLA GALAVIZ",
  "ANDERSON GONCALVES PARDINHO", "ANDRE NASCIMENTO SARAIVA", "BERNARDO PEREIRA SOSSAI",
  "CARLOS EDUARDO OLIVEIRA MILANEZ", "CIRLENE FERREIRA SILVA LIMA", "CYNTHIA LOUISE RIBEIRO FERREIRA",
  "DOUGLAS DOS SANTOS BROESCHALDT", "EDSON BULHOES", "EDUARDO DE OLIVEIRA LIRIA",
  "EDUARDO LUIZ FERREIRA SILVA", "ELSON VIEIRA OLIVEIRA", "FABIO RODRIGO FERNANDES DE OLIVEIRA",
  "FABRICIO PLASTER", "FERNANDO TADEU RIOS DIAS", "FLAVIO HENRIQUE FONTES LEITE",
  "FRANCISCO DE SOUZA GONCALVES", "GREGORY VELOSO SILVA", "GUSTAVO LEITE TINELLI",
  "HEISTHEN MAZZEI SCARPARO", "ISAC ANDRE DA SILVA", "JACO FRANCA CONCEICAO ROMANHA",
  "JOAO BATISTA JULIATTI", "JONAS BARBOSA DA SILVA", "JOSE LUCAS CAMPOS",
  "JOSE RICARDO ZAVARIZE", "JULIO CESAR NUNES ALVARENGA", "JULIO CEZAR PAGIO",
  "KROLL LEITE MARQUES", "LUCAS LAIGNIER SOUZA CORREA", "LUCAS RIBEIRO AREAS",
  "MARLI BROMMENSCHENKEL BARRETO", "MAX STEINER", "MISSIAS HENRIQUE PEREIRA MARQUES",
  "NICOLAU TECIANELLI COUTINHO", "RODRIGO DE OLIVEIRA MACHADO", "SANDRO SANTOS SILVA",
  "STEPHANY GHIOTTO LIMA BINO SERRI"
];

const SEED_INSTRUCTORS: Instructor[] = INITIAL_NAMES.map((nome, idx) => ({
  id: `inst-seed-${idx}`,
  nome,
  area: Area.NAO_DEFINIDA,
  tipoContrato: TipoContrato.MENSALISTA,
  cargaSemanalHoras: 40,
  status: 'Ativo',
  turnoTrabalho: TurnoTrabalho.MATUTINO_VESPERTINO
}));

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    return localStorage.getItem('pcp_profile') as UserProfile || null;
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Estados principais
  const [sessions, setSessions] = useState<Session[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>(SEED_INSTRUCTORS);
  const [turmas, setTurmas] = useState<TurmaCurso[]>([]);
  const [activities, setActivities] = useState<InstructorActivity[]>([]);
  const [environments, setEnvironments] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [matrizTurno, setMatrizTurno] = useState<MatrizTurno[]>(INITIAL_MATRIZ_TURNO);
  const [customWorkingDays, setCustomWorkingDays] = useState<Record<number, number>>({});

  const addLog = (action: string, details: string) => {
    const newLog: AuditLogType = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user: 'Coordenação',
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('pcp_profile', profile);
    addLog('LOGIN', 'Acesso ao terminal de coordenação');
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('pcp_profile');
  };

  const handleImportComplete = (newSessions: Session[], newInsts: Instructor[], fileName: string) => {
    setSessions(prev => [...prev, ...newSessions]);
    
    // Lógica para NÃO duplicar instrutores, apenas adicionar novos se não existirem na lista de nomes
    setInstructors(prev => {
      const existingNames = new Set(prev.map(i => i.nome.toUpperCase()));
      const filteredNew = newInsts.filter(ni => !existingNames.has(ni.nome.toUpperCase()));
      return [...prev, ...filteredNew];
    });

    setImportHistory(prev => [{
      id: Date.now().toString(),
      name: fileName,
      date: new Date().toLocaleString(),
      count: newSessions.length
    }, ...prev]);
    
    addLog('IMPORTAÇÃO', `Arquivo ${fileName} processado com ${newSessions.length} aulas.`);
  };

  if (!userProfile) return <Login onLogin={handleLogin} />;

  return (
    <Router>
      <Layout userProfile={userProfile} onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard sessions={sessions} instructors={instructors} activities={activities} />} />
          <Route path="/importar" element={<ImportWizard onComplete={handleImportComplete} history={importHistory} />} />
          <Route path="/agenda" element={<Agenda sessions={sessions} setSessions={setSessions} instructors={instructors} activities={activities} />} />
          <Route path="/planejador" element={<SchedulePlanner turmas={turmas} instructors={instructors} sessions={sessions} setSessions={setSessions} addLog={addLog} />} />
          <Route path="/produtividade" element={<ProductivityMatrix sessions={sessions} instructors={instructors} customWorkingDays={customWorkingDays} />} />
          <Route path="/cadastro-turma" element={<CourseRegistration onSave={(t) => setTurmas([...turmas, t])} />} />
          <Route path="/instrutores-areas" element={<InstructorsAreas instructors={instructors} setInstructors={setInstructors} />} />
          <Route path="/ambientes" element={<EnvironmentManagement environments={environments} setEnvironments={setEnvironments} sessions={sessions} />} />
          <Route path="/contrato-capacidade" element={<ContractCapacity instructors={instructors} setInstructors={setInstructors} activities={activities} setActivities={setActivities} />} />
          <Route path="/pendencias" element={<Pendencies sessions={sessions} instructors={instructors} activities={activities} setSessions={setSessions} />} />
          <Route path="/ocupacao-instrutor" element={<Occupation type="instructor" sessions={sessions} instructors={instructors} customWorkingDays={customWorkingDays} />} />
          <Route path="/ocupacao-area" element={<Occupation type="area" sessions={sessions} instructors={instructors} customWorkingDays={customWorkingDays} />} />
          <Route path="/ocupacao-ambiente" element={<Occupation type="environment" sessions={sessions} instructors={instructors} customWorkingDays={customWorkingDays} />} />
          <Route path="/auditoria" element={<AuditLog logs={auditLogs} />} />
          <Route path="/configuracoes" element={<Settings matrizTurno={matrizTurno} setMatrizTurno={setMatrizTurno} customWorkingDays={customWorkingDays} setCustomWorkingDays={setCustomWorkingDays} />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
