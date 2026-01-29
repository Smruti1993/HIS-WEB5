import { Home, Users, Calendar, Settings, Clock, Activity, Database, CreditCard } from 'lucide-react';

export const APP_NAME = "MediCore HMS";

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: Home },
  { label: 'Appointments', path: '/appointments', icon: Calendar },
  { label: 'Patients', path: '/patients', icon: Users },
  { label: 'Billing', path: '/billing', icon: CreditCard },
  { label: 'Doctors & Staff', path: '/employees', icon: Activity },
  { label: 'Availability', path: '/availability', icon: Clock },
  { label: 'Masters', path: '/masters', icon: Settings },
  { label: 'Connection', path: '/connection', icon: Database },
];

export const MOCK_DEPARTMENTS = [
  { id: '1', name: 'Cardiology', code: 'CARD', status: 'Active' },
  { id: '2', name: 'Neurology', code: 'NEURO', status: 'Active' },
  { id: '3', name: 'General Medicine', code: 'GEN', status: 'Active' },
  { id: '4', name: 'Orthopedics', code: 'ORTHO', status: 'Active' },
];

export const MOCK_EMPLOYEES = [
  { 
    id: '101', firstName: 'Sarah', lastName: 'Connor', email: 's.connor@medicore.com', 
    phone: '555-0101', role: 'Doctor', departmentId: '1', specialization: 'Heart Surgeon', status: 'Active' 
  },
  { 
    id: '102', firstName: 'Gregory', lastName: 'House', email: 'g.house@medicore.com', 
    phone: '555-0102', role: 'Doctor', departmentId: '3', specialization: 'Diagnostician', status: 'Active' 
  },
];