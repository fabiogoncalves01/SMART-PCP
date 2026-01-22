
import { Turno, MatrizTurno } from './types';

export const INITIAL_MATRIZ_TURNO: MatrizTurno[] = [
  // Padrão detectado no print do usuário
  { id: 'mt-full-day', inicioString: "08:00 09:00 10:00 11:00 13:00 14:00 15:00 16:00", turno: Turno.MANHA },
  
  // Padrões padrão Senai
  { id: 'mt-manha-1', inicioString: "07:30 08:25 09:20 10:15", turno: Turno.MANHA },
  { id: 'mt-manha-2', inicioString: "07:30 08:25 09:15 10:10", turno: Turno.MANHA },
  { id: 'mt-tarde-1', inicioString: "13:30 14:25 15:20 16:15", turno: Turno.TARDE },
  { id: 'mt-tarde-2', inicioString: "13:00 13:55 14:50 15:45", turno: Turno.TARDE },
  { id: 'mt-noite-1', inicioString: "18:30 19:25 20:20 21:15", turno: Turno.NOITE },
];

export const INITIAL_MONTHLY_CAPACITY: any[] = [];
