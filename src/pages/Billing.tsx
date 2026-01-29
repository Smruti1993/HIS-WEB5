import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Printer, DollarSign, FileText, Trash2, X, History, CreditCard } from 'lucide-react';
import { Bill, BillItem, Payment } from '../types';

export const Billing = () => {
  const { bills, createBill, addPayment, patients, appointments, showToast } = useData();
  
  // --- List View State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // --- Create Bill Modal State ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBillPatient, setNewBillPatient] = useState('');
  const [newBillAppt, setNewBillAppt] = useState('');
  const [billItems, setBillItems] = useState<Omit<BillItem, 'id'>[]>([
      { description: 'Consultation Fee', quantity: 1, unitPrice: 50, total: 50 }
  ]);

  // --- Payment Modal State ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');

  // --- Derived Data ---
  const filteredBills = bills.filter(b => {
      const p = patients.find(pat => pat.id === b.patientId);
      const nameMatch = p ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const statusMatch = statusFilter === 'All' || b.status === statusFilter;
      return nameMatch && statusMatch;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Handlers: Create Bill ---
  
  const updateItem = (index: number, field: keyof Omit<BillItem, 'id'>, value: any) => {
      const newItems = [...billItems];
      const item = { ...newItems[index], [field]: value };
      
      // Auto calc total
      if (field === 'quantity' || field === 'unitPrice') {
          item.total = Number(item.quantity) * Number(item.unitPrice);
      }
      
      newItems[index] = item;
      setBillItems(newItems);
  };

  const addItem = () => {
      setBillItems([...billItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
      if (billItems.length > 1) {
          setBillItems(billItems.filter((_, i) => i !== index));
      }
  };

  const handleCreateBill = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBillPatient) return;

      const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0);
      
      const newBill: Bill = {
          id: Date.now().toString(),
          patientId: newBillPatient,
          appointmentId: newBillAppt || undefined,
          date: new Date().toISOString(),
          status: 'Unpaid',
          totalAmount,
          paidAmount: 0,
          items: billItems.map((item, idx) => ({ ...item, id: `${Date.now()}-${idx}` })),
          payments: []
      };

      createBill(newBill);
      setShowCreateModal(false);
      // Reset
      setNewBillPatient('');
      setNewBillAppt('');
      setBillItems([{ description: 'Consultation Fee', quantity: 1, unitPrice: 50, total: 50 }]);
  };

  // --- Handlers: Payment ---

  const openPaymentModal = (bill: Bill) => {
      setSelectedBill(bill);
      const remaining = bill.totalAmount - bill.paidAmount;
      setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '0');
      setAmountError('');
      setShowPaymentModal(true);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPaymentAmount(val);

      if (!selectedBill) return;
      if (!val) {
          setAmountError('');
          return;
      }

      const amount = parseFloat(val);
      const remaining = selectedBill.totalAmount - selectedBill.paidAmount;

      if (isNaN(amount) || amount <= 0) {
          setAmountError('Enter a valid positive amount');
      } else if (amount > remaining + 0.01) { // 0.01 buffer for float issues
          setAmountError(`Amount cannot exceed $${remaining.toFixed(2)}`);
      } else {
          setAmountError('');
      }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBill || !paymentAmount || amountError) return;

      const amount = parseFloat(paymentAmount);
      const remaining = selectedBill.totalAmount - selectedBill.paidAmount;

      if (isNaN(amount) || amount <= 0) {
          showToast('error', 'Please enter a valid payment amount.');
          return;
      }

      if (amount > remaining + 0.01) {
          showToast('error', `Amount exceeds remaining balance of $${remaining.toFixed(2)}`);
          return;
      }

      const payment: Payment = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          amount: amount,
          method: paymentMethod as any,
          reference: paymentRef
      };

      addPayment(payment, selectedBill.id);
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentRef('');
      setAmountError('');
  };

  // --- Handlers: Print ---

  const handlePrint = (bill: Bill) => {
      const patient = patients.find(p => p.id === bill.patientId);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice #${bill.id.slice(-6)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 50px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 5px; }
            .sub-logo { font-size: 13px; color: #64748b; }
            .meta { text-align: right; }
            .invoice-title { font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 5px 0; }
            .invoice-meta { font-size: 14px; color: #64748b; line-height: 1.6; }
            
            .columns { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
            .col-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700; margin-bottom: 8px; }
            .address { font-size: 15px; line-height: 1.6; color: #334155; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px 0; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
            td { padding: 16px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .totals-container { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals { width: 300px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #64748b; }
            .total-row { font-weight: 700; font-size: 18px; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 15px; margin-top: 10px; }
            .paid-row { color: #16a34a; font-weight: 500; }
            .due-row { color: #dc2626; font-weight: 600; font-size: 16px; border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 5px; }
            
            .status-badge { 
                display: inline-block; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 10px;
            }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-partial { background: #ffedd5; color: #9a3412; }
            .status-unpaid { background: #fee2e2; color: #991b1b; }

            .payment-history { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .payment-history h4 { font-size: 14px; font-weight: 700; margin-bottom: 15px; color: #0f172a; }
            .payment-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; }
            
            @media print {
                body { padding: 0; }
                .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">MediCore HMS</div>
              <div class="sub-logo">Excellence in Healthcare Management</div>
            </div>
            <div class="meta">
              <h1 class="invoice-title">INVOICE</h1>
              <div class="invoice-meta">
                #${bill.id.slice(-6)}<br>
                ${new Date(bill.date).toLocaleDateString()}
              </div>
              <div class="status-badge status-${bill.status.toLowerCase()}">${bill.status}</div>
            </div>
          </div>

          <div class="columns">
            <div style="flex: 1;">
               <div class="col-title">From</div>
               <div class="address">
                 <strong>MediCore Hospital</strong><br>
                 123 Health Avenue<br>
                 Medical District, HC 90210<br>
                 billing@medicore.com
               </div>
            </div>
            <div style="flex: 1;">
               <div class="col-title">Bill To</div>
               <div class="address">
                 <strong>${patient?.firstName} ${patient?.lastName}</strong><br>
                 ${patient?.address || 'No address provided'}<br>
                 ${patient?.phone || ''}<br>
                 ${patient?.email || ''}
               </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>
                    <div style="font-weight: 500; color: #0f172a;">${item.description}</div>
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right" style="font-weight: 500;">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-container">
            <div class="totals">
               <div class="row">
                 <span>Subtotal</span>
                 <span>$${bill.totalAmount.toFixed(2)}</span>
               </div>
               <div class="row">
                 <span>Tax (0%)</span>
                 <span>$0.00</span>
               </div>
               <div class="row total-row">
                 <span>Total</span>
                 <span>$${bill.totalAmount.toFixed(2)}</span>
               </div>
               <div class="row paid-row">
                 <span>Amount Paid</span>
                 <span>$${bill.paidAmount.toFixed(2)}</span>
               </div>
               <div class="row due-row">
                 <span>Balance Due</span>
                 <span>$${(bill.totalAmount - bill.paidAmount).toFixed(2)}</span>
               </div>
            </div>
          </div>

          ${bill.payments && bill.payments.length > 0 ? `
            <div class="payment-history">
              <h4>Payment History</h4>
              ${bill.payments.map(p => `
                <div class="payment-row">
                   <span>${new Date(p.date).toLocaleDateString()} &mdash; ${p.method} ${p.reference ? `(${p.reference})` : ''}</span>
                   <span>$${p.amount.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px;">
             Thank you for choosing MediCore HMS. Get well soon!
          </div>

          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Billing & Invoices</h2>
           <p className="text-slate-500 text-sm">Manage patient invoices and payments</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
           <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Search patient..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="bg-white border border-slate-300 text-slate-600 text-sm rounded-lg px-3 py-2 outline-none"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="All">All Status</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
            </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Invoice ID</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Patient</th>
                        <th className="px-6 py-3 font-semibold">Amount</th>
                        <th className="px-6 py-3 font-semibold">Paid</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredBills.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                No invoices found
                            </td>
                        </tr>
                    ) : (
                        filteredBills.map(bill => {
                            const patient = patients.find(p => p.id === bill.patientId);
                            return (
                                <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{bill.id.slice(-6)}</td>
                                    <td className="px-6 py-4">{new Date(bill.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{patient?.firstName} {patient?.lastName}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">${bill.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-green-600">${bill.paidAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                            bill.status === 'Partial' ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {bill.status !== 'Paid' && (
                                                <button 
                                                    onClick={() => openPaymentModal(bill)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Record Payment"
                                                >
                                                    <DollarSign className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handlePrint(bill)}
                                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Print Invoice"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-blue-600" /> Create New Invoice
                      </h3>
                      <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <form onSubmit={handleCreateBill} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="form-label">Patient</label>
                              <select 
                                  required 
                                  className="form-input"
                                  value={newBillPatient}
                                  onChange={e => setNewBillPatient(e.target.value)}
                              >
                                  <option value="">Select Patient</option>
                                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="form-label">Link Appointment (Optional)</label>
                              <select 
                                  className="form-input"
                                  value={newBillAppt}
                                  onChange={e => setNewBillAppt(e.target.value)}
                              >
                                  <option value="">None</option>
                                  {appointments
                                      .filter(a => a.patientId === newBillPatient && a.status === 'Completed')
                                      .map(a => <option key={a.id} value={a.id}>{new Date(a.date).toLocaleDateString()} - {a.time}</option>)
                                  }
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="form-label mb-2 flex justify-between">
                              <span>Bill Items</span>
                          </label>
                          <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-slate-500">
                                      <tr>
                                          <th className="px-4 py-2 text-left">Description</th>
                                          <th className="px-4 py-2 w-24">Qty</th>
                                          <th className="px-4 py-2 w-32">Unit Price</th>
                                          <th className="px-4 py-2 w-32 text-right">Total</th>
                                          <th className="px-4 py-2 w-10"></th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {billItems.map((item, idx) => (
                                          <tr key={idx}>
                                              <td className="p-2">
                                                  <input 
                                                      className="w-full border-none bg-transparent outline-none focus:ring-1 focus:ring-blue-200 rounded px-2"
                                                      placeholder="Item description"
                                                      value={item.description}
                                                      onChange={e => updateItem(idx, 'description', e.target.value)}
                                                  />
                                              </td>
                                              <td className="p-2">
                                                  <input 
                                                      type="number" min="1"
                                                      className="w-full border-none bg-transparent outline-none focus:ring-1 focus:ring-blue-200 rounded px-2"
                                                      value={item.quantity}
                                                      onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                  />
                                              </td>
                                              <td className="p-2">
                                                  <input 
                                                      type="number" min="0" step="0.01"
                                                      className="w-full border-none bg-transparent outline-none focus:ring-1 focus:ring-blue-200 rounded px-2"
                                                      value={item.unitPrice}
                                                      onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                  />
                                              </td>
                                              <td className="p-2 text-right font-medium">
                                                  ${item.total.toFixed(2)}
                                              </td>
                                              <td className="p-2 text-center">
                                                  <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                                      <Trash2 className="w-4 h-4" />
                                                  </button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                          <button 
                              type="button" 
                              onClick={addItem}
                              className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                          >
                              <Plus className="w-4 h-4" /> Add Item
                          </button>
                      </div>

                      <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
                          <div className="text-right">
                              <span className="text-sm text-slate-500">Total Amount</span>
                              <div className="text-2xl font-bold text-slate-800">
                                  ${billItems.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                              </div>
                          </div>
                          <button 
                              type="submit" 
                              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                          >
                              Generate Invoice
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Record Payment</h3>
                  <p className="text-sm text-slate-500 mb-4">Invoice #{selectedBill.id.slice(-6)} • Total: ${selectedBill.totalAmount.toFixed(2)}</p>

                  {/* Payment History Section */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5 max-h-40 overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                        <History className="w-3.5 h-3.5 mr-1.5" /> Payment History
                    </h4>
                    {selectedBill.payments && selectedBill.payments.length > 0 ? (
                        <div className="space-y-2">
                             {[...selectedBill.payments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                                 <div key={p.id} className="flex justify-between items-start text-xs text-slate-600 p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                                     <div>
                                         <div className="font-medium text-slate-800 mb-0.5">{new Date(p.date).toLocaleDateString()}</div>
                                         <div className="text-slate-500 flex flex-wrap gap-1">
                                             <span className="flex items-center"><CreditCard className="w-3 h-3 mr-1" />{p.method}</span>
                                             {p.reference && <span className="text-slate-400">• Ref: {p.reference}</span>}
                                         </div>
                                     </div>
                                     <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">+${p.amount.toFixed(2)}</span>
                                 </div>
                             ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-400 text-xs italic">
                            No previous payments recorded.
                        </div>
                    )}
                  </div>

                  <form onSubmit={handleRecordPayment} className="space-y-4 border-t border-slate-100 pt-4">
                      <div>
                          <label className="form-label">Payment Amount</label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                              <input 
                                  type="number" step="0.01"
                                  className={`form-input pl-8 font-medium ${amountError ? 'border-red-500 focus:ring-red-200' : ''}`}
                                  value={paymentAmount}
                                  onChange={handleAmountChange}
                              />
                          </div>
                          {amountError ? (
                              <p className="text-xs text-red-500 mt-1 font-medium">{amountError}</p>
                          ) : (
                              <p className="text-xs text-slate-500 mt-1">Remaining Balance: ${(selectedBill.totalAmount - selectedBill.paidAmount).toFixed(2)}</p>
                          )}
                      </div>

                      <div>
                          <label className="form-label">Payment Method</label>
                          <select 
                              className="form-input"
                              value={paymentMethod}
                              onChange={e => setPaymentMethod(e.target.value)}
                          >
                              <option>Cash</option>
                              <option>Card</option>
                              <option>Insurance</option>
                              <option>Online</option>
                          </select>
                      </div>

                      <div>
                          <label className="form-label">Reference / Note (Optional)</label>
                          <input 
                              className="form-input"
                              placeholder="e.g. Transaction ID"
                              value={paymentRef}
                              onChange={e => setPaymentRef(e.target.value)}
                          />
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button 
                              type="button" 
                              onClick={() => setShowPaymentModal(false)}
                              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              disabled={!!amountError || !paymentAmount}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-md shadow-green-200 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
                          >
                              Confirm Payment
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};