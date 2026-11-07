import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Search, X, UserPlus, Network, Phone, Calendar, Pencil, Users, User, Camera, Upload, Trash2, QrCode, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { Patient } from '../types';
import { AbdmVerificationModal } from '../components/patient/AbdmVerificationModal';
import { PatientQrModal } from '../components/patient/PatientQrModal';
import { getPatientFinancialSummary, PatientFinancialSummary } from '../utils/patientFinancials';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAge = (dob: string) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};
const getAgeCategory = (age: number): 'Infant' | 'Child' | 'Adult' => {
  if (age < 2) return 'Infant';
  if (age < 13) return 'Child';
  return 'Adult';
};
const getInitials = (firstName: string, lastName: string) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();

// ─── Colour palettes ──────────────────────────────────────────────────────────
const CARD_PALETTES = [
  { card: 'bg-teal-50 border-teal-200', avatar: 'bg-teal-600', badge: 'bg-teal-100 text-teal-700 border-teal-200', info: 'bg-teal-100/70 border-teal-200', icon: 'text-teal-600 bg-teal-200/60', abdm: 'bg-teal-100 border-teal-200 text-teal-700 hover:bg-teal-200', blob: 'bg-teal-200/40' },
  { card: 'bg-indigo-50 border-indigo-200', avatar: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', info: 'bg-indigo-100/70 border-indigo-200', icon: 'text-indigo-600 bg-indigo-200/60', abdm: 'bg-indigo-100 border-indigo-200 text-indigo-700 hover:bg-indigo-200', blob: 'bg-indigo-200/40' },
  { card: 'bg-rose-50 border-rose-200', avatar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700 border-rose-200', info: 'bg-rose-100/70 border-rose-200', icon: 'text-rose-600 bg-rose-200/60', abdm: 'bg-rose-100 border-rose-200 text-rose-700 hover:bg-rose-200', blob: 'bg-rose-200/40' },
  { card: 'bg-amber-50 border-amber-200', avatar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', info: 'bg-amber-100/70 border-amber-200', icon: 'text-amber-600 bg-amber-200/60', abdm: 'bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200', blob: 'bg-amber-200/40' },
  { card: 'bg-sky-50 border-sky-200', avatar: 'bg-sky-600', badge: 'bg-sky-100 text-sky-700 border-sky-200', info: 'bg-sky-100/70 border-sky-200', icon: 'text-sky-600 bg-sky-200/60', abdm: 'bg-sky-100 border-sky-200 text-sky-700 hover:bg-sky-200', blob: 'bg-sky-200/40' },
  { card: 'bg-emerald-50 border-emerald-200', avatar: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', info: 'bg-emerald-100/70 border-emerald-200', icon: 'text-emerald-600 bg-emerald-200/60', abdm: 'bg-emerald-100 border-emerald-200 text-emerald-700 hover:bg-emerald-200', blob: 'bg-emerald-200/40' },
];
const getPalette = (index: number) => CARD_PALETTES[index % CARD_PALETTES.length];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; count: number; label: string; iconBg: string; iconColor: string; borderColor: string; bg: string }> = ({ icon, count, label, iconBg, iconColor, borderColor, bg }) => (
  <div className={`flex items-center gap-3 ${bg} border ${borderColor} rounded-xl px-4 py-3 min-w-[110px]`}>
    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div>
      <div className="text-xl font-bold text-slate-800 leading-none">{count}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  </div>
);

// ─── Photo Upload Widget ──────────────────────────────────────────────────────
interface PhotoUploadProps {
  value: string;          // current base64 / URL
  onChange: (url: string) => void;
}
const PhotoUpload: React.FC<PhotoUploadProps> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Preview circle */}
      <div
        onClick={() => inputRef.current?.click()}
        className="w-24 h-24 rounded-full border-2 border-dashed border-teal-400 bg-teal-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-teal-600 hover:bg-teal-100 transition-all relative group"
        title="Click to upload photo"
      >
        {value ? (
          <>
            <img src={value} alt="Patient" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-teal-500">
            <Camera className="w-7 h-7" />
            <span className="text-[10px] font-medium">Upload</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Upload className="w-3 h-3" />
          {value ? 'Change' : 'Choose Photo'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = ''; }}
            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:bg-red-50 border border-red-200 px-2 py-1.5 rounded-lg transition-colors"
            title="Remove photo"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      <p className="text-[10px] text-slate-400">JPG / PNG / WEBP • max 2 MB</p>
    </div>
  );
};

// ─── Patient Card ─────────────────────────────────────────────────────────────
interface PatientCardProps {
  patient: Patient;
  palette: typeof CARD_PALETTES[0];
  financials?: PatientFinancialSummary;
  formatCurrency: (amount: number) => string;
  onAbdm: () => void;
  onEdit: () => void;
  onViewQr: () => void;
}
const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  palette, 
  financials,
  formatCurrency,
  onAbdm, 
  onEdit,
  onViewQr
}) => {
  const age = getAge(patient.dob);
  const category = getAgeCategory(age);
  const initials = getInitials(patient.firstName, patient.lastName);
  const regDate = patient.registrationDate
    ? new Date(patient.registrationDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className={`rounded-2xl border ${palette.card} overflow-hidden relative flex flex-col p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group bg-white/40`}>
      {/* Decorative Blobs */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${palette.blob} rounded-full translate-x-6 -translate-y-6 pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-20 h-20 ${palette.blob} rounded-full -translate-x-6 translate-y-6 opacity-60 pointer-events-none`} />

      {/* Top Action / Header Bar with QR trigger, Dues indicator & Edit */}
      <div className="relative z-10 flex items-center justify-between mb-1 gap-1.5">
        {/* Quick QR code button */}
        <button
          type="button"
          onClick={onViewQr}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 hover:border-teal-400 text-teal-700 hover:text-teal-800 text-xs font-bold shadow-xs transition-all cursor-pointer group/qr"
          title="Scan or View QR Code with Patient Info & Dues"
        >
          <QrCode className="w-5 h-5 text-teal-600 group-hover/qr:scale-110 transition-transform" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide">QR Code</span>
        </button>

        {/* Financial dues badge */}
        {financials && (
          <button
            type="button"
            onClick={onViewQr}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer truncate max-w-[140px] shadow-xs ${
              financials.hasDues
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={financials.hasDues ? `Pending: ${formatCurrency(financials.totalPendingDue)} (Click for breakdown)` : 'All dues clear (Click to view QR)'}
          >
            {financials.hasDues ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">Due: {formatCurrency(financials.totalPendingDue)}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Clear</span>
              </>
            )}
          </button>
        )}

        {/* Edit Button */}
        <button
          type="button"
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-white hover:border-blue-300 transition-colors shadow-xs cursor-pointer ml-auto"
          title="Edit patient"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Center Hero: Prominent Photo & Name */}
      <div className="relative z-10 flex flex-col items-center text-center mt-1">
        {/* Large, Clear Photo Avatar with prominent attached QR Badge */}
        <div className="relative mb-3 inline-block">
          <div 
            onClick={onViewQr}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl ${palette.avatar} text-white text-xl font-black flex items-center justify-center shrink-0 shadow-md overflow-hidden border-2 border-white ring-2 ring-black/5 cursor-pointer hover:ring-teal-400 transition-all group/avatar relative`}
            title="Click to view QR & Patient details"
          >
            {patient.photoUrl ? (
              <img 
                src={patient.photoUrl} 
                alt={`${patient.firstName} ${patient.lastName}`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span>{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
              <QrCode className="w-10 h-10 text-white drop-shadow-md" />
            </div>
          </div>

          {/* Prominent floating QR badge right on the avatar */}
          <button
            type="button"
            onClick={onViewQr}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-600 hover:text-white shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 group/qrbadge"
            title="Scan / View QR Code"
          >
            <QrCode className="w-5 h-5 transition-transform group-hover/qrbadge:scale-110" />
          </button>
        </div>

        {/* Patient Name */}
        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate w-full uppercase" title={`${patient.firstName} ${patient.lastName}`}>
          {patient.firstName} {patient.lastName}
        </h3>

        {/* Age & Category Badges */}
        <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
          <span className={`inline-flex items-center text-[11px] font-semibold border rounded-md px-2 py-0.5 ${palette.badge}`}>
            {age} Y / {patient.gender}
          </span>
          <span className={`text-[11px] font-bold border rounded-md px-2 py-0.5 ${palette.badge}`}>
            {category}
          </span>
        </div>
      </div>

      {/* Info Rows (Contact & Registered) */}
      <div className="relative z-10 space-y-2 mt-4 flex-1">
        <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${palette.info}`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${palette.icon}`}>
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-500 font-medium leading-none">Contact</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{patient.phone || '—'}</div>
          </div>
        </div>

        <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${palette.info}`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${palette.icon}`}>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-500 font-medium leading-none">Registered</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{regDate}</div>
          </div>
        </div>
      </div>

      {/* Footer Actions: ABDM Verification + Prominent QR Code button */}
      <div className="relative z-10 mt-4 pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onAbdm}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold border rounded-xl py-2.5 transition-all ${palette.abdm} shadow-xs cursor-pointer`}
        >
          <Network className="w-4 h-4" />
          ABDM Verification
        </button>
        <button
          type="button"
          onClick={onViewQr}
          className="h-10 px-3.5 flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-teal-500/40 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 shadow-xs transition-all font-bold text-xs cursor-pointer group/qrbtn shrink-0"
          title="Scan / View QR Code & Dues"
        >
          <QrCode className="w-5 h-5 text-teal-600 group-hover/qrbtn:text-white group-hover/qrbtn:scale-110 transition-all" />
          <span>Scan QR</span>
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Patients = () => {
  const { 
    patients, 
    addPatient, 
    updatePatient, 
    organizations, 
    showToast,
    appointments,
    bills,
    serviceOrders,
    prescriptions,
    formatCurrency
  } = useData();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female' | 'Under 13'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [showAbdmModal, setShowAbdmModal] = useState(false);
  const [selectedAbdmPatient, setSelectedAbdmPatient] = useState<Patient | undefined>(undefined);
  const [selectedQrPatient, setSelectedQrPatient] = useState<Patient | null>(null);

  // Financial summary per patient (unpaid bills, un-invoiced services, pending prescriptions)
  const patientFinancialsMap = useMemo(() => {
    const map = new Map<string, PatientFinancialSummary>();
    patients.forEach(p => {
      map.set(p.id, getPatientFinancialSummary(p.id, appointments, bills, serviceOrders, prescriptions));
    });
    return map;
  }, [patients, appointments, bills, serviceOrders, prescriptions]);

  const selectedQrSummary = useMemo(() => {
    if (!selectedQrPatient) return null;
    return patientFinancialsMap.get(selectedQrPatient.id) || getPatientFinancialSummary(selectedQrPatient.id, appointments, bills, serviceOrders, prescriptions);
  }, [selectedQrPatient, patientFinancialsMap, appointments, bills, serviceOrders, prescriptions]);

  const initialFormState = {
    firstName: '', lastName: '', dob: '', gender: 'Male',
    phone: '', email: '', address: '', arabicName: '',
    nationalId: '', sponsorName: 'CASH', policyNo: '', cardNo: '',
    photoUrl: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const toggleForm = () => {
    if (showForm) { setShowForm(false); setEditingId(null); setFormData(initialFormState); }
    else setShowForm(true);
  };

  const handleEdit = (p: Patient) => {
    setFormData({
      firstName: p.firstName, lastName: p.lastName, dob: p.dob,
      gender: p.gender, phone: p.phone, email: p.email, address: p.address,
      arabicName: p.arabicName || '', nationalId: p.nationalId || '',
      sponsorName: p.sponsorName || 'CASH', policyNo: p.policyNo || '', cardNo: p.cardNo || '',
      photoUrl: p.photoUrl || '',
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePatient(editingId, { ...formData, photoUrl: formData.photoUrl || undefined } as any);
    } else {
      addPatient({
        id: Date.now().toString(),
        registrationDate: new Date().toISOString(),
        ...formData,
        photoUrl: formData.photoUrl || undefined,
      } as any);
    }
    setShowForm(false); setEditingId(null); setFormData(initialFormState);
  };

  // Stats
  const stats = useMemo(() => ({
    total: patients.length,
    males: patients.filter(p => p.gender === 'Male').length,
    females: patients.filter(p => p.gender === 'Female').length,
    under13: patients.filter(p => getAge(p.dob) < 13).length,
  }), [patients]);

  // Filter
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const term = searchTerm.toLowerCase();
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchesSearch = !term || fullName.includes(term) || p.phone.includes(term);
      let matchesGender = true;
      if (genderFilter === 'Male') matchesGender = p.gender === 'Male';
      else if (genderFilter === 'Female') matchesGender = p.gender === 'Female';
      else if (genderFilter === 'Under 13') matchesGender = getAge(p.dob) < 13;
      return matchesSearch && matchesGender;
    });
  }, [patients, searchTerm, genderFilter]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filterBtnCls = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Patients</h2>
        <div className="flex gap-2.5">
          <button
            onClick={() => { setSelectedAbdmPatient(undefined); setShowAbdmModal(true); }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 text-sm"
          >
            <Network className="w-4 h-4 text-blue-600" /> ABDM
          </button>
          <button
            onClick={toggleForm}
            className={`${showForm ? 'bg-slate-500 hover:bg-slate-600' : 'bg-teal-600 hover:bg-teal-700'} text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 text-sm`}
          >
            {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Patient Registration'}
          </button>
        </div>
      </div>

      {/* Registration / Edit Form */}
      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-teal-100 animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6">
            {editingId ? 'Edit Patient Details' : 'New Patient Registration'}
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Photo + fields side by side on larger screens */}
            <div className="flex flex-col lg:flex-row gap-8 mb-6">

              {/* Photo Upload */}
              <div className="flex flex-col items-center justify-start pt-2 lg:w-40 shrink-0">
                <label className="form-label mb-3 self-start lg:self-center">Patient Photo</label>
                <PhotoUpload
                  value={formData.photoUrl}
                  onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                />
              </div>

              {/* All text fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="form-label">First Name</label>
                  <input required className="form-input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input required className="form-input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input required type="date" className="form-input" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input required type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Arabic Name</label>
                  <input className="form-input" value={formData.arabicName} onChange={e => setFormData({...formData, arabicName: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">National ID / Iqama</label>
                  <input className="form-input" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Sponsor</label>
                  <select className="form-input" value={formData.sponsorName} onChange={e => setFormData({...formData, sponsorName: e.target.value})}>
                    <option value="CASH">CASH</option>
                    {organizations.map(org => <option key={org.id} value={org.name}>{org.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Policy No.</label>
                  <input className="form-input" value={formData.policyNo} onChange={e => setFormData({...formData, policyNo: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Card No.</label>
                  <input className="form-input" value={formData.cardNo} onChange={e => setFormData({...formData, cardNo: e.target.value})} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="form-label">Address</label>
                  <textarea className="form-input h-20" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
                </div>
              </div>
            </div>

            {/* Form buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={toggleForm} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-teal-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-teal-700 shadow-lg shadow-teal-200">
                {editingId ? 'Save Changes' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex flex-wrap gap-3">
        <StatCard icon={<Users className="w-4 h-4" />} count={stats.total} label="Total patients" iconBg="bg-teal-100" iconColor="text-teal-600" borderColor="border-teal-200" bg="bg-teal-50" />
        <StatCard icon={<User className="w-4 h-4" />} count={stats.males} label="Male" iconBg="bg-blue-100" iconColor="text-blue-600" borderColor="border-blue-200" bg="bg-blue-50" />
        <StatCard icon={<User className="w-4 h-4" />} count={stats.females} label="Female" iconBg="bg-rose-100" iconColor="text-rose-600" borderColor="border-rose-200" bg="bg-rose-50" />
        <StatCard icon={<User className="w-4 h-4" />} count={stats.under13} label="Under 13" iconBg="bg-amber-100" iconColor="text-amber-600" borderColor="border-amber-200" bg="bg-amber-50" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            placeholder="Search by name or phone"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {(['All', 'Male', 'Female', 'Under 13'] as const).map(f => (
            <button key={f} onClick={() => { setGenderFilter(f); setCurrentPage(1); }} className={filterBtnCls(genderFilter === f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      {filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No patients found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
          {paginatedPatients.map((patient, idx) => {
            const globalIdx = (currentPage - 1) * itemsPerPage + idx;
            return (
              <PatientCard
                key={patient.id}
                patient={patient}
                palette={getPalette(globalIdx)}
                financials={patientFinancialsMap.get(patient.id)}
                formatCurrency={formatCurrency}
                onAbdm={() => { setSelectedAbdmPatient(patient); setShowAbdmModal(true); }}
                onEdit={() => handleEdit(patient)}
                onViewQr={() => setSelectedQrPatient(patient)}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPatients.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          colorTheme="teal"
        />
      )}

      {/* ABDM Modal */}
      <AbdmVerificationModal
        isOpen={showAbdmModal}
        onClose={() => { setShowAbdmModal(false); setSelectedAbdmPatient(undefined); }}
        onSave={() => {
          showToast('success', 'ABDM demographics saved successfully!');
          setShowAbdmModal(false);
          setSelectedAbdmPatient(undefined);
        }}
        initialPatient={selectedAbdmPatient}
      />

      {/* Patient QR & Financial Dues Modal */}
      {selectedQrPatient && selectedQrSummary && (
        <PatientQrModal
          isOpen={!!selectedQrPatient}
          onClose={() => setSelectedQrPatient(null)}
          patient={selectedQrPatient}
          summary={selectedQrSummary}
        />
      )}
    </div>
  );
};
