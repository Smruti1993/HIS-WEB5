import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Printer, CreditCard, DollarSign, FileText, Trash2, X, CheckCircle } from 'lucide-react';
import { Bill, BillItem, Payment } from '../types';

export const Billing = () => {
  const { bills, createBill, addPayment, patients, appointments } = useData();
  
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
      setPaymentAmount((bill.totalAmount - bill.paidAmount).toString()); // Default to remaining
      setShowPaymentModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBill || !paymentAmount) return;

      const payment: Payment = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          amount: parseFloat(paymentAmount),
          method: paymentMethod as any,
          reference: paymentRef
      };

      addPayment(payment, selectedBill.id);
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentRef('');
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
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .meta { text-align: right; line-height: 1.6; }
            .bill-to { margin-bottom: 30px; }
            .bill-to h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #888; }
            table { w-full; width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; font-size: 12px; text-transform: uppercase; color: #888; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .totals { float: right; width: 300px; text-align: right; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total-row { font-weight: bold; font-size: 18px; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
            .status { font-weight: bold; text-transform: uppercase; border: 2px solid #333; padding: 5px 10px; display: inline-block; transform: rotate(-5deg); opacity: 0.3; }
            .paid { color: green; border-color: green; }
            .unpaid { color: red; border-color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">MediCore HMS</div>
              <p>123 Medical Plaza<br>Health City, HC 90210</p>
            </div>
            <div class="meta">
              <h1>INVOICE</h1>
              <p><strong>Invoice #:</strong> ${bill.id.slice(-6)}<br>
              <strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}</p>
              <div class="status ${bill.status.toLowerCase()}">${bill.status}</div>
            </div>
          </div>

          <div class="bill-to">
            <h3>Bill To:</h3>
            <strong>${patient?.firstName} ${patient?.lastName}</strong><br>
            ${patient?.phone || ''}<br>
            ${patient?.address || ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
                  <td style="text-align: right;">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Subtotal:</span> <span>$${bill.totalAmount.toFixed(2)}</span></div>
            <div class="row"><span>Tax (0%):</span> <span>$0.00</span></div>
            <div class="row total-row"><span>Total:</span> <span>$${bill.totalAmount.toFixed(2)}</span></div>
            <div class="row" style="color: green; margin-top: 10px;"><span>Amount Paid:</span> <span>$${bill.paidAmount.toFixed(2)}</span></div>
            <div class="row" style="color: red;"><span>Balance Due:</span> <span>$${(bill.totalAmount - bill.paidAmount).toFixed(2)}</span></div>
          </div>
          
          <script>window.print();</script>
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
                  <p className="text-sm text-slate-500 mb-6">Invoice #{selectedBill.id.slice(-6)} • Total: ${selectedBill.totalAmount}</p>

                  <form onSubmit={handleRecordPayment} className="space-y-4">
                      <div>
                          <label className="form-label">Payment Amount</label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                              <input 
                                  type="number" step="0.01" max={selectedBill.totalAmount - selectedBill.paidAmount}
                                  className="form-input pl-8"
                                  value={paymentAmount}
                                  onChange={e => setPaymentAmount(e.target.value)}
                              />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Remaining Balance: ${(selectedBill.totalAmount - selectedBill.paidAmount).toFixed(2)}</p>
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
                              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-md shadow-green-200"
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