import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Patient, Employee, Department, Unit, ServiceCentre, 
  DoctorAvailability, Appointment, ToastMessage, EmployeeRole 
} from '../types';
import { MOCK_DEPARTMENTS, MOCK_EMPLOYEES } from '../constants';

interface DataContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  
  departments: Department[];
  addDepartment: (dept: Department) => void;
  
  units: Unit[];
  addUnit: (unit: Unit) => void;
  
  serviceCentres: ServiceCentre[];
  addServiceCentre: (sc: ServiceCentre) => void;
  
  availabilities: DoctorAvailability[];
  saveAvailability: (avail: DoctorAvailability) => void;
  
  appointments: Appointment[];
  bookAppointment: (apt: Appointment) => void;
  
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State Initialization (Load from LocalStorage or Default) ---
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : MOCK_EMPLOYEES;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('departments');
    return saved ? JSON.parse(saved) : MOCK_DEPARTMENTS;
  });

  const [units, setUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem('units');
    return saved ? JSON.parse(saved) : [];
  });

  const [serviceCentres, setServiceCentres] = useState<ServiceCentre[]>(() => {
    const saved = localStorage.getItem('serviceCentres');
    return saved ? JSON.parse(saved) : [];
  });

  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>(() => {
    const saved = localStorage.getItem('availabilities');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem('patients', JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem('employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('departments', JSON.stringify(departments)), [departments]);
  useEffect(() => localStorage.setItem('units', JSON.stringify(units)), [units]);
  useEffect(() => localStorage.setItem('serviceCentres', JSON.stringify(serviceCentres)), [serviceCentres]);
  useEffect(() => localStorage.setItem('availabilities', JSON.stringify(availabilities)), [availabilities]);
  useEffect(() => localStorage.setItem('appointments', JSON.stringify(appointments)), [appointments]);

  // --- Actions ---
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addPatient = (p: Patient) => {
    setPatients(prev => [...prev, p]);
    showToast('success', `Patient ${p.firstName} registered successfully.`);
  };

  const addEmployee = (e: Employee) => {
    setEmployees(prev => [...prev, e]);
    showToast('success', `${e.role} ${e.lastName} added.`);
  };

  const addDepartment = (d: Department) => {
    setDepartments(prev => [...prev, d]);
    showToast('success', 'Department added.');
  };

  const addUnit = (u: Unit) => {
    setUnits(prev => [...prev, u]);
    showToast('success', 'Unit added.');
  };

  const addServiceCentre = (s: ServiceCentre) => {
    setServiceCentres(prev => [...prev, s]);
    showToast('success', 'Service Centre added.');
  };

  const saveAvailability = (avail: DoctorAvailability) => {
    // Remove existing for same doctor/day to avoid duplicates (simplified logic)
    setAvailabilities(prev => {
      const filtered = prev.filter(a => !(a.doctorId === avail.doctorId && a.dayOfWeek === avail.dayOfWeek));
      return [...filtered, avail];
    });
    showToast('success', 'Schedule updated.');
  };

  const bookAppointment = (apt: Appointment) => {
    setAppointments(prev => [...prev, apt]);
    showToast('success', 'Appointment booked successfully!');
  };

  return (
    <DataContext.Provider value={{
      patients, addPatient,
      employees, addEmployee,
      departments, addDepartment,
      units, addUnit,
      serviceCentres, addServiceCentre,
      availabilities, saveAvailability,
      appointments, bookAppointment,
      toasts, showToast, removeToast
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};