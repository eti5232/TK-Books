import { Suspense } from 'react';
import { Loading } from './components/ui';
import AppRoutes from './routes/Routes';

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="container section">
          <Loading />
        </div>
      }
    >
      <AppRoutes />
    </Suspense>
  );
}
