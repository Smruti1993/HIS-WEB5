import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Stethoscope, 
  FileText, 
  Phone, 
  User, 
  Calendar, 
  MapPin, 
  Activity, 
  CreditCard 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getPatientFinancialSummary } from '../utils/patientFinancials';

export const PatientSummaryPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patients, appointments, bills, serviceOrders, prescriptions, formatCurrency, branches } = useData();

  const patient = patients.find((p) => String(p.id) === String(patientId));
  const summary = getPatientFinancialSummary(
    patientId || '',
    appointments,
    bills,
    serviceOrders,
    prescriptions
  );

  const currencyFormatter =
    formatCurrency ||
    ((val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  const hospitalName = branches[0]?.name || 'MediCore Hospital';

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Patient Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            The patient record with ID <span className="font-mono text-slate-700">{patientId}</span> could not be found.
          </p>
          <button
            onClick={() => navigate('/patients')}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-5">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to HMS
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>{hospitalName}</span>
          </div>
        </div>

        {/* Patient Identity Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-24 h-24 rounded-2xl bg-teal-600 text-white font-extrabold text-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {patient.photoUrl ? (
              <img src={patient.photoUrl} alt={patient.firstName} className="w-full h-full object-cover" />
            ) : (
              <span>{(patient.firstName?.[0] || '') + (patient.lastName?.[0] || '')}</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              <span className="inline-block text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 w-fit mx-auto sm:mx-0">
                {patient.gender}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-mono mt-1">MRN / Patient ID: {patient.id}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs text-slate-600">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{patient.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>DOB: {patient.dob || '—'}</span>
              </div>
              {patient.address && (
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{patient.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outstanding Dues Banner */}
        <div
          className={`p-6 rounded-3xl border shadow-sm ${
            summary.hasDues
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {summary.hasDues ? (
              <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {summary.hasDues ? 'Total Outstanding Amount' : 'Payment Status'}
            </span>
          </div>

          <div className="text-4xl font-black tracking-tight my-2">
            {summary.hasDues ? currencyFormatter(summary.totalPendingDue) : 'All Settled'}
          </div>

          <p className="text-xs opacity-80 leading-relaxed">
            {summary.hasDues
              ? 'This patient has unpaid charges including uninvoiced doctor orders and pending bills.'
              : 'Zero pending balance. No unbilled services or unpaid bills.'}
          </p>
        </div>

        {/* Breakdown: Uninvoiced Services */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-amber-600" />
              Uninvoiced Services & Orders ({summary.uninvoicedServices.length})
            </h3>
            <span className="text-xs font-black text-amber-700">
              {currencyFormatter(summary.uninvoicedServicesTotal)}
            </span>
          </div>

          {summary.uninvoicedServices.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No pending un-invoiced orders.
            </p>
          ) : (
            <div className="space-y-2.5">
              {summary.uninvoicedServices.map((svc) => (
                <div
                  key={svc.id}
                  className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{svc.serviceName}</h4>
                    <span className="text-[11px] text-slate-500">
                      Qty: {svc.quantity} • Unit Price: {currencyFormatter(svc.unitPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-900 text-sm block">
                      {currencyFormatter(svc.totalPrice)}
                    </span>
                    <span className="inline-block text-[10px] bg-amber-200/90 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Not Invoiced Yet
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown: Unpaid Bills */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              Unpaid Invoices ({summary.unpaidBills.length})
            </h3>
            <span className="text-xs font-black text-rose-700">
              {currencyFormatter(summary.unpaidBillsTotal)}
            </span>
          </div>

          {summary.unpaidBills.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No unpaid invoices found.
            </p>
          ) : (
            <div className="space-y-2.5">
              {summary.unpaidBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">Invoice #{bill.invoiceNo}</h4>
                    <span className="text-[11px] text-slate-500">
                      Total: {currencyFormatter(bill.totalAmount)} • Paid: {currencyFormatter(bill.paidAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-900 text-sm block">
                      {currencyFormatter(bill.dueAmount)}
                    </span>
                    <span className="inline-block text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Hospital Footer */}
        <div className="text-center text-xs text-slate-400 py-4">
          MediCore HMS • Verified Hospital Patient QR Report
        </div>

      </div>
    </div>
  );
};

