import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CrushingSimulation as CrushingScene } from '../components/laboratory/CrushingSimulation';
import { SinteringScene } from '../components/laboratory/SinteringScene';
import { ConcentrationScene } from '../components/laboratory/ConcentrationScene';
import { OreIdentificationScene } from '../components/laboratory/OreIdentificationScene';
import { LandingScene } from '../components/laboratory/LandingScene';
import { RoastingScene } from '../components/laboratory/RoastingScene';
import { CompletionScene } from '../components/laboratory/CompletionScene';
import { ReductionScene } from '../components/laboratory/ReductionScene';
import { useIronLabSession } from '../state/IronLabSession';

type ProtectedStage = 'crushing' | 'sintering' | 'concentration' | 'roasting' | 'reduction' | 'iron-formation' | 'mind-map';
const stagePrerequisite: Record<ProtectedStage, string | null> = {
  crushing: 'identification',
  sintering: 'crushing',
  concentration: 'sintering',
  roasting: 'concentration',
  reduction: 'roasting',
  'iron-formation': 'reduction',
  'mind-map': 'iron-formation',
};
const stagePath: Record<string, string> = {
  identification: '/identification',
  crushing: '/crushing',
  sintering: '/sintering',
  concentration: '/concentration',
  roasting: '/roasting',
  reduction: '/reduction',
  'iron-formation': '/iron-formation',
  'mind-map': '/mind-map',
};

function SessionRoute({ stage, children }: { stage: ProtectedStage; children: React.ReactNode }) {
  const { session } = useIronLabSession();
  const location = useLocation();
  if (!session.oreIdentified) return <Navigate to="/identification" replace state={{ from: location.pathname }} />;
  const prerequisite = stagePrerequisite[stage];
  if (prerequisite && !session.completedStages.includes(prerequisite)) return <Navigate to={stagePath[prerequisite]} replace />;
  return children;
}

function EntryRoute() {
  const { session } = useIronLabSession();
  return session.oreIdentified ? <Navigate to={`/${session.currentStage}`} replace /> : <LandingScene />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryRoute />} />
      <Route path="/identification" element={<OreIdentificationScene />} />
      <Route path="/crushing" element={<SessionRoute stage="crushing"><CrushingScene /></SessionRoute>} />
      <Route path="/sintering" element={<SessionRoute stage="sintering"><SinteringScene /></SessionRoute>} />
      <Route path="/concentration" element={<SessionRoute stage="concentration"><ConcentrationScene /></SessionRoute>} />
      <Route path="/roasting" element={<SessionRoute stage="roasting"><RoastingScene /></SessionRoute>} />
      <Route path="/reduction" element={<SessionRoute stage="reduction"><ReductionScene /></SessionRoute>} />
      <Route path="/iron-formation" element={<SessionRoute stage="iron-formation"><Navigate to="/reduction" replace /></SessionRoute>} />
      <Route path="/mind-map" element={<SessionRoute stage="mind-map"><CompletionScene /></SessionRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
