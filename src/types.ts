/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TripConfig {
  tripDate: string | null;
  people: string[];
}

export interface Parada {
  km: string;
  nome: string;
  tag: string | null;
  desc: string;
  ideia: string;
  fonte: string;
}

export interface Pousada {
  nome: string;
  desc: string;
  tel: string | null;
  rec: boolean;
}

export interface Day {
  n: number;
  from: string;
  to: string;
  saida: string;
  km: number;
  elev: number;
  tempo: string;
  chegada: string;
  refs: string;
  alerta: string | null;
  paradas: Parada[];
  pousadas: Pousada[];
}

export interface Expense {
  id: number;
  desc: string;
  valor: number;
  cat: string;
  quem: string;
  divide: "todos" | "individual";
}

export interface SpeechLine {
  t: string;
  fase: string;
  txt: string;
  tom: string;
  camera: string;
  overlay: string;
}

export interface RecordingInstructions {
  roupa: string;
  fundo: string;
  iluminacao: string;
  ritmo: string;
  legenda: string;
}

export interface SceneBrief {
  subject: string;
  environment: string;
  camera: string;
  light: string;
}

export interface Slide {
  n: number;
  funcao: string;
  headline: string;
  sub: string;
  scene: SceneBrief;
}

export interface Reel {
  titulo: string;
  storytelling: {
    antes: string;
    transformacao: string;
    depois: string;
  };
  speech: SpeechLine[];
  gravacao: RecordingInstructions;
  caption: string;
}

export interface Carrossel {
  titulo: string;
  storytelling: {
    gancho: string;
    desenvolvimento: string;
    virada: string;
    cta: string;
  };
  slides: Slide[];
  caption: string;
}

export interface ContentStage {
  id: "pre" | "dia1" | "dia2" | "dia3" | "pos";
  stage: string;
  porta: string;
  reel: Reel;
  carrossel: Carrossel;
}

export interface EmergencyContact {
  cidade: string;
  tel: string;
  fonte: string;
}

export interface Roteiro {
  id: string;
  nome: string;
  totalKm: number;
  totalDays: number;
  descricao: string;
  days: Day[];
  links: {
    wikiloc_completa: string;
    wikiloc_cicloviagem: string;
    cptm_bike: string;
    strava?: string;
    komoot?: string;
    google_maps?: string;
  };
  cidadesEmg: EmergencyContact[];
}

export interface AppState {
  currentRouteId?: string;
  tripDate: string | null;
  people: string[];
  checklist: Record<string, boolean>;
  expenses: Expense[];
  daysDone: Record<number, boolean>;
  customRoutes?: Roteiro[];
  groupPasscode?: string;
  archivedRouteIds?: string[];
  isOfflineDownloaded?: boolean;
}
