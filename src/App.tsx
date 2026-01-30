import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Appointments } from './pages/Appointments';
import { Patients } from './pages/Patients';
import { Employees } from './pages/Employees';
import { Availability } from './pages/Availability';
import { Masters } from './pages/Masters';
import { Connection } from './pages/Connection';
import { Billing } from './pages/Billing';
import { DoctorWorkbench } from './pages/DoctorWorkbench';
import { Consultation } from './pages/Consultation';

const App = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="patients" element={<Patients />} />
            <Route path="billing" element={<Billing />} />
            <Route path="doctor-workbench" element={<DoctorWorkbench />} />
            <Route path="consultation/:appointmentId" element={<Consultation />} />
            <Route path="employees" element={<Employees />} />
            <Route path="availability" element={<Availability />} />
            <Route path="masters" element={<Masters />} />
            <Route path="connection" element={<Connection />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;