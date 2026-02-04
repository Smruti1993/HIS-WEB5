import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DatePicker } from '../components/DatePicker';
import { FileText, Printer, Filter, Download } from 'lucide-react';

interface LedgerRow {
  id: string;
  date: string; 
  voucherType: string;
  invoiceNo: string;
  type: 'Invoice' | 'Collection_Receipt';
  doctorName: string;
  serviceCode: string;
  serviceName: string;
  debit: number; // Cash / Deduction
  credit: number; // Payment
  insurance: number;
  tax: number;
}

interface PatientLedgerGroup {
  patientId: string;
  patientName: string;
  mrNo: string;
  rows: LedgerRow[];
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export const Reports = () => {
  const { bills, patients, employees, serviceDefinitions, appointments } = useData();
  const [activeReport, setActiveReport] = useState('Patient Ledger');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPatient, setSearchPatient] = useState('');

  // --- Logic for Patient Ledger ---
  const patientLedgerData = useMemo(() => {
    const groups: PatientLedgerGroup[] = [];
    const patientMap = new Map<string, PatientLedgerGroup>();

    // Helper to find service code
    const getServiceCode = (name: string) => {
        const def = serviceDefinitions.find(s => s.name === name || s.alternateName === name);
        return def ? def.code : '';
    };

    // Helper to get doctor name
    const getDocName = (empId?: string) => {
        if(!empId) return '';
        const doc = employees.find(e => e.id === empId);
        return doc ? `${doc.firstName} ${doc.lastName}` : '';
    };

    // Helper to get doctor from bill (via appointment)
    const getBillDoctor = (aptId?: string) => {
        if(!aptId) return '';
        const apt = appointments.find(a => a.id === aptId);
        return getDocName(apt?.doctorId);
    };

    bills.forEach(bill => {
        // Date Filter
        const bDate = bill.date.split('T')[0];
        if (startDate && bDate < startDate) return;
        if (endDate && bDate > endDate) return;

        const patient = patients.find(p => p.id === bill.patientId);
        if (!patient) return;

        // Patient Search Filter
        const pName = `${patient.firstName} ${patient.lastName}`;
        if (searchPatient && !pName.toLowerCase().includes(searchPatient.toLowerCase()) && !patient.id.includes(searchPatient)) {
            return;
        }

        // Initialize Group if not exists
        if (!patientMap.has(patient.id)) {
            patientMap.set(patient.id, {
                patientId: patient.id,
                patientName: pName,
                mrNo: patient.id.slice(-8).toUpperCase(), // Simulating MRNo with ID suffix
                rows: [],
                totalDebit: 0,
                totalCredit: 0,
                totalBalance: 0
            });
        }
        const group = patientMap.get(patient.id)!;

        // 1. Process Bill Items (Invoices)
        bill.items.forEach(item => {
            group.rows.push({
                id: item.id,
                date: bill.date,
                voucherType: 'CASH', // Assuming Cash invoices for now, could be 'CREDIT' based on bill type
                invoiceNo: `INV-${bill.id.slice(-8).toUpperCase()}`,
                type: 'Invoice',
                doctorName: getBillDoctor(bill.appointmentId),
                serviceCode: getServiceCode(item.description),
                serviceName: item.description,
                debit: item.total,
                credit: 0,
                insurance: 0, // Placeholder
                tax: 0 // Placeholder
            });
        });

        // 2. Process Payments (Receipts)
        bill.payments.forEach(pay => {
            group.rows.push({
                id: pay.id,
                date: pay.date,
                voucherType: 'Payment',
                invoiceNo: `RCP-${pay.id.slice(-8).toUpperCase()}`,
                type: 'Collection_Receipt',
                doctorName: '',
                serviceCode: '',
                serviceName: '',
                debit: 0,
                credit: pay.amount,
                insurance: 0,
                tax: 0
            });
        });
    });

    // Sort rows within groups and calculate totals
    patientMap.forEach(group => {
        // Sort by date ascending
        group.rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calc totals
        group.totalDebit = group.rows.reduce((sum, r) => sum + r.debit, 0);
        group.totalCredit = group.rows.reduce((sum, r) => sum + r.credit, 0);
        group.totalBalance = group.totalDebit - group.totalCredit; // Simple balance logic
        
        groups.push(group);
    });

    return groups;
  }, [bills, patients, employees, serviceDefinitions, appointments, startDate, endDate, searchPatient]);

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
           <p className="text-slate-500 text-sm">Financial and clinical reports</p>
        </div>
        <div className="flex gap-2">
            <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-50">
                <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-colors">
                <Printer className="w-4 h-4" /> Print Report
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[calc(100vh-200px)] flex flex-col">
        {/* Report Selection & Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between">
            
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-200 p-1 rounded-lg w-fit h-fit shrink-0">
                {['Patient Ledger', 'Daily Collection', 'Service Revenue'].map(r => (
                    <button
                        key={r}
                        onClick={() => setActiveReport(r)}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                            activeReport === r 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">Date:</span>
                    <input 
                        type="date" 
                        className="text-xs outline-none text-slate-700 w-28"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                        type="date" 
                        className="text-xs outline-none text-slate-700 w-28"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
                
                <div className="relative">
                    <input 
                        className="pl-3 pr-8 py-1.5 border border-slate-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Search Patient / MRNo..."
                        value={searchPatient}
                        onChange={e => setSearchPatient(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Report Content - Patient Ledger */}
        {activeReport === 'Patient Ledger' && (
            <div className="flex-1 overflow-auto bg-white p-4">
                <div className="border border-slate-300 rounded-sm overflow-hidden">
                    {/* Main Table Header */}
                    <div className="grid grid-cols-12 bg-slate-100 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-300">
                        <div className="col-span-1 p-2 border-r border-slate-300">Voucher Type</div>
                        <div className="col-span-1 p-2 border-r border-slate-300">Invoice No</div>
                        <div className="col-span-1 p-2 border-r border-slate-300">Type</div>
                        <div className="col-span-1 p-2 border-r border-slate-300">Date</div>
                        <div className="col-span-2 p-2 border-r border-slate-300">Doctor Name</div>
                        <div className="col-span-1 p-2 border-r border-slate-300">Service Code</div>
                        <div className="col-span-2 p-2 border-r border-slate-300">Service Name</div>
                        <div className="col-span-1 p-2 border-r border-slate-300 text-right">Cash / Ded.</div>
                        <div className="col-span-1 p-2 border-r border-slate-300 text-right">Payment</div>
                        <div className="col-span-1 p-2 text-right">Balance</div>
                    </div>

                    {/* Report Body */}
                    {patientLedgerData.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm">No records found matching criteria.</div>
                    ) : (
                        patientLedgerData.map(group => (
                            <div key={group.patientId} className="group">
                                {/* Group Header */}
                                <div className="bg-slate-50 border-b border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-800 flex gap-4">
                                    <span>Mrno: <span className="font-mono text-blue-700">{group.mrNo}</span></span>
                                    <span>PatientName: <span className="text-blue-700">{group.patientName}</span></span>
                                </div>

                                {/* Rows */}
                                {group.rows.map((row, idx) => (
                                    <div key={idx} className="grid grid-cols-12 text-[11px] border-b border-slate-200 text-slate-600 hover:bg-yellow-50">
                                        <div className="col-span-1 p-1.5 border-r border-slate-200 truncate">{row.voucherType}</div>
                                        <div className="col-span-1 p-1.5 border-r border-slate-200 truncate font-medium">{row.invoiceNo}</div>
                                        <div className="col-span-1 p-1.5 border-r border-slate-200 truncate">{row.type}</div>
                                        <div className="col-span-1 p-1.5 border-r border-slate-200 truncate">
                                            {new Date(row.date).toLocaleString([], {year: 'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="col-span-2 p-1.5 border-r border-slate-200 truncate" title={row.doctorName}>{row.doctorName}</div>
                                        <div className="col-span-1 p-1.5 border-r border-slate-200 truncate">{row.serviceCode}</div>
                                        <div className="col-span-2 p-1.5 border-r border-slate-200 truncate" title={row.serviceName}>{row.serviceName}</div>
                                        <div className="col-span-1 p-1.5 border-r border-slate-200 text-right font-medium">
                                            {row.debit > 0 ? row.debit.toFixed(2) : '0.00'}
                                        </div>
                                        <div className="col-span-1 p-1.5 border-r border-slate-200 text-right font-medium">
                                            {row.credit > 0 ? row.credit.toFixed(2) : ''}
                                        </div>
                                        <div className="col-span-1 p-1.5 text-right">0.00</div>
                                    </div>
                                ))}

                                {/* Group Footer / Total */}
                                <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-bold border-b-2 border-slate-300 text-slate-800">
                                    <div className="col-span-8 p-1.5 border-r border-slate-200 text-right pr-4">Patient Total</div>
                                    <div className="col-span-1 p-1.5 border-r border-slate-200 text-right">{group.totalDebit.toFixed(2)}</div>
                                    <div className="col-span-1 p-1.5 border-r border-slate-200 text-right">{group.totalCredit.toFixed(2)}</div>
                                    <div className="col-span-1 p-1.5 text-right">{group.totalBalance.toFixed(2)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Placeholder for other reports */}
        {activeReport !== 'Patient Ledger' && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-400">This report is under development.</p>
            </div>
        )}
      </div>
    </div>
  );
};