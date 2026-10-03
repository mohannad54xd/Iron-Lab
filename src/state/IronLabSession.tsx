import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ironOres } from '../data/ironOres';
import type { IronOreId } from '../data/ironOres';
import { roastingMassTrendObservations } from '../data/ironOres';
import { concentrationLab } from '../data/concentration';
import { reductionSequenceObservation, crushingLab } from '../data/extraction';
import { sinteringLab } from '../data/sintering';
import { useLabAudio } from '../audio/LabAudio';

const STORAGE_KEY = 'iron-lab-session-v1';
const sessionStages = ['identification', 'crushing', 'sintering', 'concentration', 'roasting', 'reduction', 'iron-formation', 'mind-map'] as const;
const oreIds = Object.keys(ironOres) as IronOreId[];
type SessionStage = (typeof sessionStages)[number];
const legacyObservationFacts: Record<string, string> = {
  'Crushing decreases particle size while mass remains unchanged.': crushingLab.concept,
  [sinteringLab.explanation]: sinteringLab.explanation,
  [concentrationLab.explanation]: concentrationLab.explanation,
  [reductionSequenceObservation]: reductionSequenceObservation,
};

function isSessionStage(stage: unknown): stage is SessionStage {
  return typeof stage === 'string' && sessionStages.includes(stage as SessionStage);
}

export type IronLabSession = {
  oreType: IronOreId | null;
  oreFormula: string | null;
  oreName: string | null;
  oreIdentified: boolean;
  currentStage: SessionStage;
  completedStages: string[];
  observations: string[];
  discoveredEquations: string[];
  discoveredFacts: string[];
};

export type OreProgress = {
  oreId: IronOreId;
  started: boolean;
  completed: boolean;
  currentStage: SessionStage;
  completedStages: string[];
  discoveredEquations: string[];
  discoveredFacts: string[];
  observations: string[];
  runSnapshot: IronLabSession | null;
};

export type IronLabProgress = {
  ores: Record<IronOreId, OreProgress>;
};

export type DiscoveryNotice = {
  id: number;
  kind: 'observation' | 'equation';
  text: string;
};

const emptySession: IronLabSession = {
  oreType: null,
  oreFormula: null,
  oreName: null,
  oreIdentified: false,
  currentStage: 'identification',
  completedStages: [],
  observations: [],
  discoveredEquations: [],
  discoveredFacts: [],
};

function emptyOreProgress(oreId: IronOreId): OreProgress {
  return {
    oreId,
    started: false,
    completed: false,
    currentStage: 'identification',
    completedStages: [],
    discoveredEquations: [],
    discoveredFacts: [],
    observations: [],
    runSnapshot: null,
  };
}

function emptyProgress(): IronLabProgress {
  return { ores: Object.fromEntries(oreIds.map((oreId) => [oreId, emptyOreProgress(oreId)])) as Record<IronOreId, OreProgress> };
}

type StoredLabState = {
  currentRun: IronLabSession;
  progress: IronLabProgress;
};

type IronLabSessionContextValue = {
  session: IronLabSession;
  progress: IronLabProgress;
  discoveryNotice: DiscoveryNotice | null;
  identifyOre: (oreType: IronOreId) => void;
  startOre: (oreType: IronOreId) => void;
  resumeOre: (oreType: IronOreId) => void;
  viewOreJourney: (oreType: IronOreId) => void;
  restartCurrentRun: () => void;
  resetAllProgress: () => void;
  setCurrentStage: (stage: SessionStage) => void;
  completeStage: (stage: string) => void;
  discoverObservation: (observation: string) => void;
  discoverEquation: (equation: string) => void;
  discoverFact: (fact: string) => void;
  dismissDiscoveryNotice: () => void;
  resetSession: () => void;
};

const IronLabSessionContext = createContext<IronLabSessionContextValue | null>(null);

function isRunComplete(session: IronLabSession) {
  return session.completedStages.includes('iron-formation') && session.completedStages.includes('iron');
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseSession(value: unknown): IronLabSession {
  if (!value || typeof value !== 'object') return emptySession;
  const parsed = value as Partial<IronLabSession>;
  if (!parsed.oreType || !(parsed.oreType in ironOres)) return emptySession;
  const ore = ironOres[parsed.oreType];
  const savedCompletedStages = parseStringArray(parsed.completedStages);
  const completedStages = savedCompletedStages.includes('iron') && !savedCompletedStages.includes('iron-formation')
    ? [...savedCompletedStages, 'iron-formation']
    : savedCompletedStages;
  const discoveredFacts = parseStringArray(parsed.discoveredFacts);
  const migratedObservations = discoveredFacts.flatMap((fact) => legacyObservationFacts[fact] ?? []);
  const savedObservations = parseStringArray(parsed.observations);
  const roastingObservation = completedStages.includes('roasting') && ore.massTrend
    ? [roastingMassTrendObservations[ore.massTrend]]
    : [];
  return {
    oreType: ore.id,
    oreName: ore.name,
    oreFormula: ore.formula,
    oreIdentified: Boolean(parsed.oreIdentified),
    currentStage: isSessionStage(parsed.currentStage) ? parsed.currentStage : 'crushing',
    completedStages,
    observations: [...new Set([...savedObservations, ...migratedObservations, ...roastingObservation])],
    discoveredEquations: parseStringArray(parsed.discoveredEquations),
    discoveredFacts,
  };
}

function createRun(oreId: IronOreId): IronLabSession {
  const ore = ironOres[oreId];
  return {
    ...emptySession,
    oreType: ore.id,
    oreName: ore.name,
    oreFormula: ore.formula,
    oreIdentified: true,
    currentStage: 'crushing',
    completedStages: ['identification'],
    discoveredFacts: [`Ore identified: ${ore.name} (${ore.formula}).`],
  };
}

function mergeOreProgress(progress: OreProgress, run: IronLabSession): OreProgress {
  if (!run.oreIdentified || !run.oreType) return progress;
  const complete = isRunComplete(run);
  return {
    oreId: run.oreType,
    started: true,
    completed: progress.completed || complete,
    currentStage: run.currentStage,
    completedStages: [...new Set([...progress.completedStages, ...run.completedStages])],
    discoveredEquations: [...new Set([...progress.discoveredEquations, ...run.discoveredEquations])],
    discoveredFacts: [...new Set([...progress.discoveredFacts, ...run.discoveredFacts])],
    observations: [...new Set([...progress.observations, ...run.observations])],
    runSnapshot: complete ? null : run,
  };
}

function commitRun(state: StoredLabState, run: IronLabSession): StoredLabState {
  if (!run.oreIdentified || !run.oreType) return { ...state, currentRun: run };
  const previous = state.progress.ores[run.oreType] ?? emptyOreProgress(run.oreType);
  const nextProgress = mergeOreProgress(previous, run);
  return {
    currentRun: run,
    progress: { ores: { ...state.progress.ores, [run.oreType]: nextProgress } },
  };
}

function saveCurrentRun(state: StoredLabState) {
  return state.currentRun.oreIdentified ? commitRun(state, state.currentRun) : state;
}

function sessionFromProgress(progress: OreProgress): IronLabSession {
  const ore = ironOres[progress.oreId];
  let completedStages = [...progress.completedStages];
  if (progress.completed) completedStages = [...new Set([...completedStages, 'iron-formation', 'iron'])];
  return {
    oreType: ore.id,
    oreName: ore.name,
    oreFormula: ore.formula,
    oreIdentified: true,
    currentStage: progress.completed ? 'mind-map' : progress.currentStage,
    completedStages,
    observations: [...progress.observations],
    discoveredEquations: [...progress.discoveredEquations],
    discoveredFacts: [...progress.discoveredFacts],
  };
}

function parseProgress(value: unknown): IronLabProgress {
  const progress = emptyProgress();
  if (!value || typeof value !== 'object') return progress;
  const rawOres = (value as Partial<IronLabProgress>).ores;
  if (!rawOres || typeof rawOres !== 'object') return progress;
  for (const oreId of oreIds) {
    const raw = rawOres[oreId] as Partial<OreProgress> | undefined;
    if (!raw) continue;
    const snapshot = raw.runSnapshot ? parseSession(raw.runSnapshot) : emptySession;
    progress.ores[oreId] = {
      oreId,
      started: Boolean(raw.started),
      completed: Boolean(raw.completed),
      currentStage: isSessionStage(raw.currentStage) ? raw.currentStage : 'identification',
      completedStages: parseStringArray(raw.completedStages),
      discoveredEquations: parseStringArray(raw.discoveredEquations),
      discoveredFacts: parseStringArray(raw.discoveredFacts),
      observations: parseStringArray(raw.observations),
      runSnapshot: snapshot.oreType === oreId && snapshot.oreIdentified && !isRunComplete(snapshot) ? snapshot : null,
    };
  }
  return progress;
}

function readStoredState(): StoredLabState {
  const initial = { currentRun: emptySession, progress: emptyProgress() };
  if (typeof window === 'undefined') return initial;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initial;
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    if ('currentRun' in parsed) {
      const currentRun = parseSession(parsed.currentRun);
      const progress = parseProgress(parsed.progress);
      return currentRun.oreIdentified ? commitRun({ currentRun, progress }, currentRun) : { currentRun, progress };
    }
    const legacyRun = parseSession(parsed);
    return legacyRun.oreIdentified ? commitRun(initial, legacyRun) : initial;
  } catch {
    return initial;
  }
}

export function IronLabSessionProvider({ children }: { children: ReactNode }) {
  const { playSound } = useLabAudio();
  const [storedState, setStoredState] = useState<StoredLabState>(readStoredState);
  const [discoveryNotice, setDiscoveryNotice] = useState<DiscoveryNotice | null>(null);
  const discoveryIdRef = useRef(0);
  const { currentRun: session, progress } = storedState;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
    } catch {
      // Storage may be unavailable in a restricted browser context.
    }
  }, [storedState]);

  const startOre = useCallback((oreType: IronOreId) => {
    setDiscoveryNotice(null);
    setStoredState((current) => commitRun(saveCurrentRun(current), createRun(oreType)));
  }, []);

  const resumeOre = useCallback((oreType: IronOreId) => {
    setStoredState((current) => {
      const saved = current.progress.ores[oreType];
      if (!saved.started || (saved.completed && !saved.runSnapshot)) return current;
      const run = saved.runSnapshot ?? sessionFromProgress(saved);
      return commitRun(saveCurrentRun(current), run);
    });
    setDiscoveryNotice(null);
  }, []);

  const viewOreJourney = useCallback((oreType: IronOreId) => {
    setStoredState((current) => {
      const saved = current.progress.ores[oreType];
      if (!saved.completed) return current;
      return commitRun(saveCurrentRun(current), sessionFromProgress(saved));
    });
    setDiscoveryNotice(null);
  }, []);

  const identifyOre = startOre;
  const restartCurrentRun = useCallback(() => {
    if (session.oreType) startOre(session.oreType);
  }, [session.oreType, startOre]);
  const resetAllProgress = useCallback(() => {
    setStoredState({ currentRun: emptySession, progress: emptyProgress() });
    setDiscoveryNotice(null);
  }, []);

  const setCurrentStage = useCallback((stage: SessionStage) => setStoredState((current) => commitRun(current, { ...current.currentRun, currentStage: stage })), []);
  const completeStage = useCallback((stage: string) => {
    if (session.completedStages.includes(stage)) return;
    playSound('stage-complete');
    setStoredState((current) => {
      if (current.currentRun.completedStages.includes(stage)) return current;
      return commitRun(current, { ...current.currentRun, completedStages: [...current.currentRun.completedStages, stage] });
    });
  }, [playSound, session.completedStages]);
  const publishDiscovery = useCallback((kind: DiscoveryNotice['kind'], text: string) => {
    discoveryIdRef.current += 1;
    setDiscoveryNotice({ id: discoveryIdRef.current, kind, text });
    playSound('knowledge-discovered');
  }, [playSound]);
  const discoverObservation = useCallback((observation: string) => {
    if (session.observations.includes(observation)) return;
    setStoredState((current) => current.currentRun.observations.includes(observation) ? current : commitRun(current, {
      ...current.currentRun,
      observations: [...current.currentRun.observations, observation],
    }));
    publishDiscovery('observation', observation);
  }, [publishDiscovery, session.observations]);
  const discoverEquation = useCallback((equation: string) => {
    if (session.discoveredEquations.includes(equation)) return;
    setStoredState((current) => current.currentRun.discoveredEquations.includes(equation) ? current : commitRun(current, {
      ...current.currentRun,
      discoveredEquations: [...current.currentRun.discoveredEquations, equation],
    }));
    publishDiscovery('equation', equation);
  }, [publishDiscovery, session.discoveredEquations]);
  const discoverFact = useCallback((fact: string) => setStoredState((current) => current.currentRun.discoveredFacts.includes(fact) ? current : commitRun(current, {
    ...current.currentRun,
    discoveredFacts: [...current.currentRun.discoveredFacts, fact],
  })), []);
  const dismissDiscoveryNotice = useCallback(() => setDiscoveryNotice(null), []);
  const resetSession = restartCurrentRun;

  const value = useMemo(() => ({
    session,
    progress,
    discoveryNotice,
    identifyOre,
    startOre,
    resumeOre,
    viewOreJourney,
    restartCurrentRun,
    resetAllProgress,
    setCurrentStage,
    completeStage,
    discoverObservation,
    discoverEquation,
    discoverFact,
    dismissDiscoveryNotice,
    resetSession,
  }), [session, progress, discoveryNotice, identifyOre, startOre, resumeOre, viewOreJourney, restartCurrentRun, resetAllProgress, setCurrentStage, completeStage, discoverObservation, discoverEquation, discoverFact, dismissDiscoveryNotice, resetSession]);

  return (
    <IronLabSessionContext.Provider value={value}>
      {children}
    </IronLabSessionContext.Provider>
  );
}

export function useIronLabSession() {
  const context = useContext(IronLabSessionContext);
  if (!context) throw new Error('useIronLabSession must be used within IronLabSessionProvider.');
  return context;
}
