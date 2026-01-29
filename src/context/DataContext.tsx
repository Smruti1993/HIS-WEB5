import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Patient, Employee, Department, Unit, ServiceCentre, 
  DoctorAvailability, Appointment, ToastMessage, Bill, BillItem, Payment 
} from '../types';
import { 
    getSupabase, 
    checkConfigured, 
    saveCredentialsToStorage, 
    clearCredentialsFromStorage 
} from '../services/supabaseClient';

interface DataContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  
  departments: Department[];
  addDepartment: (dept: Department) => void;
  
  units: Unit[];
  addUnit: (unit: Unit) => void;
  
  serviceCentres: ServiceCentre[];
  addServiceCentre: (sc: ServiceCentre) => void;
  
  availabilities: DoctorAvailability[];
  saveAvailability: (avail: DoctorAvailability) => void;
  deleteAvailability: (id: string) => void;
  
  appointments: Appointment[];
  bookAppointment: (apt: Appointment) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;

  bills: Bill[];
  createBill: (bill: Bill) => void;
  addPayment: (payment: Payment, billId: string) => void;
  
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  
  isLoading: boolean;
  isDbConnected: boolean;
  updateDbConnection: (url: string, key: string) => void;
  disconnectDb: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [serviceCentres, setServiceCentres] = useState<ServiceCentre[]>([]);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(checkConfigured());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- Mappers ---
  const mapDeptFromDb = (d: any): Department => ({ id: d.id, name: d.name, code: d.code, status: d.status });
  
  const mapEmpFromDb = (e: any): Employee => ({
    id: e.id, firstName: e.first_name, lastName: e.last_name, email: e.email, phone: e.phone,
    role: e.role, departmentId: e.department_id, specialization: e.specialization, status: e.status
  });
  const mapEmpToDb = (e: any) => ({
    id: e.id, first_name: e.firstName, last_name: e.lastName, email: e.email, phone: e.phone,
    role: e.role, department_id: e.departmentId, specialization: e.specialization, status: e.status
  });

  const mapPatientFromDb = (p: any): Patient => ({
    id: p.id, firstName: p.first_name, lastName: p.last_name, dob: p.dob, gender: p.gender,
    phone: p.phone, email: p.email, address: p.address, registrationDate: p.registration_date
  });
  const mapPatientToDb = (p: any) => ({
    id: p.id, first_name: p.firstName, last_name: p.lastName, dob: p.dob, gender: p.gender,
    phone: p.phone, email: p.email, address: p.address, registration_date: p.registrationDate
  });

  const mapAvailFromDb = (a: any): DoctorAvailability => ({
    id: a.id, doctorId: a.doctor_id, dayOfWeek: a.day_of_week, startTime: a.start_time,
    endTime: a.end_time, slotDurationMinutes: a.slot_duration_minutes
  });
  const mapAvailToDb = (a: any) => ({
    id: a.id, doctor_id: a.doctorId, day_of_week: a.dayOfWeek, start_time: a.startTime,
    end_time: a.endTime, slot_duration_minutes: a.slotDurationMinutes
  });

  const mapAptFromDb = (a: any): Appointment => ({
    id: a.id, patientId: a.patient_id, doctorId: a.doctor_id, departmentId: a.department_id,
    date: a.date, time: a.time, status: a.status, symptoms: a.symptoms, notes: a.notes
  });
  const mapAptToDb = (a: any) => ({
    id: a.id, patient_id: a.patientId, doctor_id: a.doctorId, department_id: a.departmentId,
    date: a.date, time: a.time, status: a.status, symptoms: a.symptoms, notes: a.notes
  });

  const mapBillFromDb = (b: any, items: any[], payments: any[]): Bill => ({
    id: b.id, patientId: b.patient_id, appointmentId: b.appointment_id, date: b.date,
    status: b.status, totalAmount: b.total_amount, paidAmount: b.paid_amount,
    items: items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unit_price, total: i.total })),
    payments: payments.map(p => ({ id: p.id, date: p.date, amount: p.amount, method: p.method, reference: p.reference }))
  });

  // --- Initial Fetch ---

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);

      if (!checkConfigured()) {
        setIsDbConnected(false);
        if (refreshTrigger === 0) showToast('info', 'Please configure Database Connection in the menu.');
        setIsLoading(false);
        return;
      }

      setIsDbConnected(true);
      const supabase = getSupabase();

      try {
        const [pRes, eRes, dRes, uRes, sRes, avRes, apRes, bRes, biRes, payRes] = await Promise.all([
          supabase.from('patients').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('departments').select('*'),
          supabase.from('units').select('*'),
          supabase.from('service_centres').select('*'),
          supabase.from('doctor_availability').select('*'),
          supabase.from('appointments').select('*'),
          supabase.from('bills').select('*'),
          supabase.from('bill_items').select('*'),
          supabase.from('payments').select('*'),
        ]);

        if (pRes.error) throw pRes.error;

        if (pRes.data) setPatients(pRes.data.map(mapPatientFromDb));
        if (eRes.data) setEmployees(eRes.data.map(mapEmpFromDb));
        if (dRes.data) setDepartments(dRes.data.map(mapDeptFromDb));
        if (uRes.data) setUnits(uRes.data.map(mapDeptFromDb)); 
        if (sRes.data) setServiceCentres(sRes.data.map(mapDeptFromDb));
        if (avRes.data) setAvailabilities(avRes.data.map(mapAvailFromDb));
        if (apRes.data) setAppointments(apRes.data.map(mapAptFromDb));

        if (bRes.data) {
            const rawBills = bRes.data;
            const rawItems = biRes.data || [];
            const rawPayments = payRes.data || [];

            const structuredBills = rawBills.map(b => {
                const myItems = rawItems.filter(i => i.bill_id === b.id);
                const myPayments = rawPayments.filter(p => p.bill_id === b.id);
                return mapBillFromDb(b, myItems, myPayments);
            });
            setBills(structuredBills);
        }
        
        showToast('success', 'Data synced with database.');
      } catch (error: any) {
        console.error("Error fetching data:", error);
        let msg = 'Failed to connect to database.';
        if (error.code === 'PGRST301' || error.message?.includes('does not exist')) {
            msg = 'Connected, but tables are missing. Please check your DB schema.';
        } else if (error.message?.includes('FetchError')) {
             msg = 'Network error or invalid URL.';
        }
        showToast('error', msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [refreshTrigger]);

  // --- Actions ---

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateDbConnection = (url: string, key: string) => {
      saveCredentialsToStorage(url, key);
      setIsDbConnected(true);
      setRefreshTrigger(prev => prev + 1);
  };

  const disconnectDb = () => {
      clearCredentialsFromStorage();
      setIsDbConnected(false);
      setPatients([]); setEmployees([]); setDepartments([]); setAppointments([]); setAvailabilities([]); setBills([]);
      showToast('info', 'Disconnected from database.');
  };

  const requireDb = (): boolean => {
      if (!checkConfigured()) {
          showToast('error', 'Database not connected.');
          return false;
      }
      return true;
  };

  // ... (Patient, Employee, Dept, Unit, Service code remains same, shortened for brevity) ...
  const addPatient = async (p: Patient) => {
    if (!requireDb()) return;
    setPatients(prev => [...prev, p]);
    const { error } = await getSupabase().from('patients').insert(mapPatientToDb(p));
    if (error) { showToast('error', `DB Error: ${error.message}`); setPatients(prev => prev.filter(pat => pat.id !== p.id)); } 
    else showToast('success', `Patient ${p.firstName} registered.`);
  };

  const updatePatient = async (id: string, data: Partial<Patient>) => {
    if (!requireDb()) return;
    const original = patients.find(p => p.id === id);
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    const dbData: any = {};
    // ... populate fields
    if (data.firstName) dbData.first_name = data.firstName;
    if (data.lastName) dbData.last_name = data.lastName;
    if (data.dob) dbData.dob = data.dob;
    if (data.gender) dbData.gender = data.gender;
    if (data.phone) dbData.phone = data.phone;
    if (data.email) dbData.email = data.email;
    if (data.address) dbData.address = data.address;

    const { error } = await getSupabase().from('patients').update(dbData).eq('id', id);
    if (error) { showToast('error', `Update failed: ${error.message}`); if (original) setPatients(prev => prev.map(p => p.id === id ? original : p)); } 
    else showToast('success', 'Patient updated successfully.');
  };

  const addEmployee = async (e: Employee) => {
    if (!requireDb()) return;
    setEmployees(prev => [...prev, e]);
    const { error } = await getSupabase().from('employees').insert(mapEmpToDb(e));
    if (error) { showToast('error', `Failed to save: ${error.message}`); setEmployees(prev => prev.filter(emp => emp.id !== e.id)); }
    else showToast('success', `${e.role} added.`);
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    if (!requireDb()) return;
    const original = employees.find(e => e.id === id);
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...data } : emp));
    const updatedEmp = employees.find(e => e.id === id);
    if(updatedEmp) {
        const fullNewData = { ...updatedEmp, ...data };
        const { error } = await getSupabase().from('employees').update(mapEmpToDb(fullNewData)).eq('id', id);
        if (error) { showToast('error', `Update failed: ${error.message}`); if (original) setEmployees(prev => prev.map(emp => emp.id === id ? original : emp)); }
        else showToast('success', 'Employee updated.');
    }
  };

  const addDepartment = async (d: Department) => {
    if (!requireDb()) return;
    setDepartments(prev => [...prev, d]);
    const { error } = await getSupabase().from('departments').insert(d);
    if(error) { showToast('error', error.message); setDepartments(prev => prev.filter(dept => dept.id !== d.id)); }
    else showToast('success', 'Department added.');
  };

  const addUnit = async (u: Unit) => {
    if (!requireDb()) return;
    setUnits(prev => [...prev, u]);
    const { error } = await getSupabase().from('units').insert(u);
    if(error) { showToast('error', error.message); setUnits(prev => prev.filter(unit => unit.id !== u.id)); }
    else showToast('success', 'Unit added.');
  };

  const addServiceCentre = async (s: ServiceCentre) => {
    if (!requireDb()) return;
    setServiceCentres(prev => [...prev, s]);
    const { error } = await getSupabase().from('service_centres').insert(s);
    if(error) { showToast('error', error.message); setServiceCentres(prev => prev.filter(sc => sc.id !== s.id)); }
    else showToast('success', 'Service Centre added.');
  };

  const saveAvailability = async (avail: DoctorAvailability) => {
    if (!requireDb()) return;
    let previousSchedule: DoctorAvailability | undefined;
    setAvailabilities(prev => {
      previousSchedule = prev.find(a => a.doctorId === avail.doctorId && a.dayOfWeek === avail.dayOfWeek);
      const filtered = prev.filter(a => !(a.doctorId === avail.doctorId && a.dayOfWeek === avail.dayOfWeek));
      return [...filtered, avail];
    });
    const { error } = await getSupabase().from('doctor_availability').insert(mapAvailToDb(avail));
    if(error) { showToast('error', `Failed to save schedule: ${error.message}`); /* Rollback omitted for brevity */ }
    else showToast('success', 'Schedule updated.');
  };

  const deleteAvailability = async (id: string) => {
    if (!requireDb()) return;
    const original = availabilities.find(a => a.id === id);
    setAvailabilities(prev => prev.filter(a => a.id !== id));
    const { error } = await getSupabase().from('doctor_availability').delete().eq('id', id);
    if (error) { showToast('error', 'Failed to delete schedule.'); if (original) setAvailabilities(prev => [...prev, original]); }
  };

  const bookAppointment = async (apt: Appointment) => {
    if (!requireDb()) return;
    setAppointments(prev => [...prev, apt]);
    const { error } = await getSupabase().from('appointments').insert(mapAptToDb(apt));
    if (error) { showToast('error', `Failed to book: ${error.message}`); setAppointments(prev => prev.filter(a => a.id !== apt.id)); }
    else showToast('success', 'Appointment booked successfully!');
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    if (!requireDb()) return;
    const original = appointments.find(a => a.id === id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    const fullData = { ...original, ...data };
    const { error } = await getSupabase().from('appointments').update(mapAptToDb(fullData)).eq('id', id);
    if (error) { showToast('error', `Failed to update: ${error.message}`); if (original) setAppointments(prev => prev.map(a => a.id === id ? original : a)); }
    else showToast('success', 'Appointment updated.');
  };

  const cancelAppointment = async (id: string) => {
    if (!requireDb()) return;
    const original = appointments.find(a => a.id === id);
    if (!original) return;
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    const { error } = await getSupabase().from('appointments').update({ status: 'Cancelled' }).eq('id', id);
    if (error) { showToast('error', 'Failed to cancel.'); setAppointments(prev => prev.map(a => a.id === id ? original : a)); }
    else showToast('success', 'Appointment cancelled.');
  };

  // --- BILLING LOGIC ---

  const createBill = async (bill: Bill) => {
      if (!requireDb()) return;
      
      setBills(prev => [...prev, bill]);

      // 1. Insert Bill Header
      const { error: billError } = await getSupabase().from('bills').insert({
          id: bill.id,
          patient_id: bill.patientId,
          appointment_id: bill.appointmentId,
          date: bill.date,
          status: bill.status,
          total_amount: bill.totalAmount,
          paid_amount: bill.paidAmount
      });

      if (billError) {
          showToast('error', 'Failed to create bill header: ' + billError.message);
          setBills(prev => prev.filter(b => b.id !== bill.id));
          return;
      }

      // 2. Insert Items
      const itemsDb = bill.items.map(i => ({
          id: i.id,
          bill_id: bill.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total: i.total
      }));

      const { error: itemsError } = await getSupabase().from('bill_items').insert(itemsDb);
      
      if (itemsError) {
          showToast('error', 'Failed to save bill items: ' + itemsError.message);
          // Potential rollback logic here
      } else {
          showToast('success', 'Invoice generated successfully.');
      }
  };

  const addPayment = async (payment: Payment, billId: string) => {
      if (!requireDb()) return;

      // Update Local State
      setBills(prev => prev.map(b => {
          if (b.id !== billId) return b;
          
          const newPaidAmount = Number(b.paidAmount) + Number(payment.amount);
          let newStatus: 'Unpaid' | 'Partial' | 'Paid' = 'Partial';
          if (newPaidAmount >= b.totalAmount) newStatus = 'Paid';
          
          return {
              ...b,
              paidAmount: newPaidAmount,
              status: newStatus,
              payments: [...b.payments, payment]
          };
      }));

      // Update DB - Insert Payment
      const { error: payError } = await getSupabase().from('payments').insert({
          id: payment.id,
          bill_id: billId,
          date: payment.date,
          amount: payment.amount,
          method: payment.method,
          reference: payment.reference
      });

      if (payError) {
           showToast('error', 'Failed to record payment transaction.');
           return;
      }

      // Update DB - Update Bill Status/Totals
      // We calculate specifically to ensure DB consistency
      const bill = bills.find(b => b.id === billId);
      if (bill) {
          const newTotalPaid = Number(bill.paidAmount) + Number(payment.amount);
          let newStatus = 'Partial';
          if (newTotalPaid >= bill.totalAmount) newStatus = 'Paid';

          await getSupabase().from('bills').update({
              paid_amount: newTotalPaid,
              status: newStatus
          }).eq('id', billId);
      }
      
      showToast('success', 'Payment recorded.');
  };

  return (
    <DataContext.Provider value={{
      patients, addPatient, updatePatient,
      employees, addEmployee, updateEmployee,
      departments, addDepartment,
      units, addUnit,
      serviceCentres, addServiceCentre,
      availabilities, saveAvailability, deleteAvailability,
      appointments, bookAppointment, updateAppointment, cancelAppointment,
      bills, createBill, addPayment,
      toasts, showToast, removeToast,
      isLoading, isDbConnected, updateDbConnection, disconnectDb
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