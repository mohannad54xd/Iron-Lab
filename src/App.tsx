import AppLayout from './app/layout/AppLayout';
import AppRoutes from './app/routes';
import { IronLabSessionProvider } from './state/IronLabSession';
import { LabAudioProvider } from './audio/LabAudio';

export default function App() {
  return (
    <LabAudioProvider>
      <IronLabSessionProvider>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </IronLabSessionProvider>
    </LabAudioProvider>
  );
}
