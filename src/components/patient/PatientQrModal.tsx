import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Stethoscope, 
  Pill, 
  Download, 
  Share2, 
  ArrowRight, 
  Printer, 
  Phone, 
  Calendar,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../types';
import { PatientFinancialSummary } from '../../utils/patientFinancials';
import { useData } from '../../context/DataContext';

interface PatientQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  summary: PatientFinancialSummary;
}

export const PatientQrModal: React.FC<PatientQrModalProps> = ({
  isOpen,
  onClose,
  patient,
  summary
}) => {
  const navigate = useNavigate();
  const { formatCurrency } = useData();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bills' | 'rx'>('overview');

  const currencyFormatter = formatCurrency || ((val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  useEffect(() => {
    if (!patient || !isOpen) {
      setQrDataUrl('');
      return;
    }

    // Build the standalone mobile URL that opens upon scanning
    const scanUrl = `${window.location.origin}/#/patient-summary/${patient.id}`;

    QRCode.toDataURL(scanUrl, {
      width: 420,
      margin: 1.5,
      color: {
        dark: '#030d22',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [patient, isOpen]);

  if (!isOpen || !patient) return null;

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `patient-${patient.id}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNavigateToBilling = () => {
    onClose();
    navigate('/billing', { state: { patientId: patient.id } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {patient.photoUrl ? (
                <img src={patient.photoUrl} alt={patient.firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-white text-base">
                  {(patient.firstName?.[0] || '') + (patient.lastName?.[0] || '')}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white truncate">
                  {patient.firstName} {patient.lastName}
                </h3>
                <span className="text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded-md text-cyan-200 border border-white/10">
                  {patient.gender}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>MRN: {patient.id}</span>
                <span>•</span>
                <span>{patient.phone || 'No Phone'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Top Section: QR Code & Financial Summary Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
            
            {/* Left: Scannable QR Code Card */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-xs">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-2.5">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Patient QR Code" 
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-100 rounded-xl">
                    <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 mt-1">
                <QrCode className="w-4 h-4 text-teal-600" />
                Scan for Patient Summary & Dues
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Compatible with any smartphone camera or 2D scanner
              </p>

              {/* QR Action Buttons */}
              <div className="flex gap-2 mt-3 w-full">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-slate-500" /> Save QR
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Right: Outstanding Dues & Financial Status */}
            <div className="flex flex-col justify-between">
              
              {/* Financial Highlight Card */}
              <div 
                className={`p-5 rounded-2xl border transition-all ${
                  summary.hasDues 
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-sm' 
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {summary.hasDues ? (
                    <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {summary.hasDues ? 'Total Pending Dues' : 'Account Status'}
                  </span>
                </div>

                <div className="text-3xl font-black tracking-tight my-1">
                  {summary.hasDues 
                    ? currencyFormatter(summary.totalPendingDue) 
                    : 'All Cleared'}
                </div>

                <p className="text-xs opacity-85 leading-relaxed">
                  {summary.hasDues 
                    ? 'Payment is pending. Please collect before issuing further treatments or discharge.' 
                    : 'All bills & ordered services have been settled.'}
                </p>
              </div>

              {/* Dues Breakdown Pill Summary */}
              <div className="space-y-2 my-3">
                
                {/* 1. Uninvoiced Services */}
                <div 
                  onClick={() => setActiveTab('services')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer text-xs"
                >
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                    Uninvoiced Services ({summary.uninvoicedServices.length})
                  </span>
                  <span className={`font-bold ${summary.uninvoicedServicesTotal > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {currencyFormatter(summary.uninvoicedServicesTotal)}
                  </span>
                </div>

                {/* 2. Unpaid Invoices */}
                <div 
                  onClick={() => setActiveTab('bills')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer text-xs"
                >
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    Unpaid Invoices ({summary.unpaidBills.length})
                  </span>
                  <span className={`font-bold ${summary.unpaidBillsTotal > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                    {currencyFormatter(summary.unpaidBillsTotal)}
                  </span>
                </div>

                {/* 3. Pending Prescriptions */}
                {summary.pendingRxItems.length > 0 && (
                  <div 
                    onClick={() => setActiveTab('rx')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-xs"
                  >
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <Pill className="w-3.5 h-3.5 text-blue-600" />
                      Pending Pharmacy Rx ({summary.pendingRxItems.length})
                    </span>
                    <span className="font-bold text-blue-700">
                      {currencyFormatter(summary.pendingRxTotal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {summary.hasDues && (
                <button
                  type="button"
                  onClick={handleNavigateToBilling}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> Go to Billing & Collect Payment
                </button>
              )}

            </div>
          </div>

          {/* Bottom Section: Tabs for Deep Breakdown */}
          <div className="border-t border-slate-200 pt-4">
            
            <div className="flex border-b border-slate-200 mb-3 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Patient Details
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'services'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Uninvoiced Services
                {summary.uninvoicedServices.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                    {summary.uninvoicedServices.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bills')}
                className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bills'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Unpaid Bills
                {summary.unpaidBills.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                    {summary.unpaidBills.length}
                  </span>
                )}
              </button>

              {summary.pendingRxItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('rx')}
                  className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'rx'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Prescriptions
                </button>
              )}
            </div>

            {/* Tab 1: Patient Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Phone</span>
                  <span className="font-semibold text-slate-700">{patient.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Email</span>
                  <span className="font-semibold text-slate-700">{patient.email || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Date of Birth</span>
                  <span className="font-semibold text-slate-700">{patient.dob || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">National ID / Iqama</span>
                  <span className="font-semibold text-slate-700">{patient.nationalId || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Sponsor</span>
                  <span className="font-semibold text-slate-700">{patient.sponsorName || 'CASH'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Registered On</span>
                  <span className="font-semibold text-slate-700">
                    {patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : '—'}
                  </span>
                </div>
                {patient.address && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-slate-400 block uppercase">Address</span>
                    <span className="font-semibold text-slate-700">{patient.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Uninvoiced Services */}
            {activeTab === 'services' && (
              <div className="space-y-2">
                {summary.uninvoicedServices.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    No uninvoiced service orders. All services are billed.
                  </div>
                ) : (
                  summary.uninvoicedServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{svc.serviceName}</div>
                        <div className="text-[10px] text-slate-500">
                          Qty: {svc.quantity} × {currencyFormatter(svc.unitPrice)} • Ordered: {svc.orderDate ? new Date(svc.orderDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-amber-800 text-sm block">
                          {currencyFormatter(svc.totalPrice)}
                        </span>
                        <span className="inline-block text-[9px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                          Not Invoiced
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Unpaid Bills */}
            {activeTab === 'bills' && (
              <div className="space-y-2">
                {summary.unpaidBills.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    No unpaid bills found. All invoices are fully paid.
                  </div>
                ) : (
                  summary.unpaidBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">Invoice: {bill.invoiceNo}</div>
                        <div className="text-[10px] text-slate-500">
                          Date: {bill.date ? new Date(bill.date).toLocaleDateString() : '—'} • Total: {currencyFormatter(bill.totalAmount)} • Paid: {currencyFormatter(bill.paidAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-rose-800 text-sm block">
                          {currencyFormatter(bill.dueAmount)}
                        </span>
                        <span className="inline-block text-[9px] bg-rose-200 text-rose-900 font-bold px-1.5 py-0.2 rounded">
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Pending Rx */}
            {activeTab === 'rx' && (
              <div className="space-y-2">
                {summary.pendingRxItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No pending pharmacy prescriptions.
                  </div>
                ) : (
                  summary.pendingRxItems.map((rx) => (
                    <div
                      key={rx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{rx.medicineName}</div>
                        <div className="text-[10px] text-slate-500">
                          Qty: {rx.quantity} • Date: {rx.prescriptionDate ? new Date(rx.prescriptionDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-blue-800 text-sm block">
                          {currencyFormatter(rx.totalAmount)}
                        </span>
                        <span className="inline-block text-[9px] bg-blue-200 text-blue-900 font-bold px-1.5 py-0.2 rounded">
                          Pending Dispense
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>MediCore HMS Patient QR Verification</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

