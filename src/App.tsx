import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Garage } from './pages/Garage/Garage';
import { AddCar } from './pages/AddCar/AddCar';
import { CarHistory } from './pages/CarHistory/CarHistory';
import { AddRecord } from './pages/AddRecord/AddRecord';
import { ShareHistory, SharedView } from './pages/ShareHistory/ShareHistory';
import { AddMaintenancePlan } from './pages/AddMaintenancePlan/AddMaintenancePlan';
import { CarDescription } from './pages/CarDescription/CarDescription';
import { useWebApp } from './hooks/useWebApp';

export function App() {
  const webApp = useWebApp();

  useEffect(() => {
    // Handle deep link start_param
    const startParam = webApp.initDataUnsafe.start_param;
    if (startParam?.startsWith('share_')) {
      const token = startParam.slice(6);
      window.location.hash = `#/share/${token}`;
    } else if (startParam?.startsWith('car_')) {
      const carId = startParam.slice(4);
      window.location.hash = `#/cars/${carId}`;
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Garage />} />
      <Route path="/cars/new" element={<AddCar />} />
      <Route path="/cars/:id" element={<CarHistory />} />
      <Route path="/cars/:id/edit" element={<AddCar />} />
      <Route path="/cars/:id/share" element={<ShareHistory />} />
      <Route path="/cars/:id/description" element={<CarDescription />} />
      <Route path="/cars/:carId/records/new" element={<AddRecord />} />
      <Route path="/cars/:carId/records/:recordId" element={<AddRecord />} />
      <Route path="/cars/:carId/maintenance/new" element={<AddMaintenancePlan />} />
      <Route path="/cars/:carId/maintenance/:planId" element={<AddMaintenancePlan />} />
      <Route path="/share/:token" element={<SharedView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
