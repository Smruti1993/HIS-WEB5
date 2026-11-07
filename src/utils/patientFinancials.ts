import { Patient, Bill, ServiceOrder, Appointment, Prescription } from '../types';

export interface UnpaidBillItem {
  id: string;
  invoiceNo: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
}

export interface UninvoicedServiceItem {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderDate: string;
  status: string;
  serviceCenter?: string;
}

export interface PendingPrescriptionItem {
  id: string;
  medicineName: string;
  quantity: number;
  totalAmount: number;
  prescriptionDate: string;
}

export interface PatientFinancialSummary {
  patientId: string;
  totalPendingDue: number;
  hasDues: boolean;
  unpaidBills: UnpaidBillItem[];
  unpaidBillsTotal: number;
  uninvoicedServices: UninvoicedServiceItem[];
  uninvoicedServicesTotal: number;
  pendingRxItems: PendingPrescriptionItem[];
  pendingRxTotal: number;
}

export function getPatientFinancialSummary(
  patientId: string,
  appointments: Appointment[] = [],
  bills: Bill[] = [],
  serviceOrders: ServiceOrder[] = [],
  prescriptions: Prescription[] = []
): PatientFinancialSummary {
  if (!patientId) {
    return {
      patientId: '',
      totalPendingDue: 0,
      hasDues: false,
      unpaidBills: [],
      unpaidBillsTotal: 0,
      uninvoicedServices: [],
      uninvoicedServicesTotal: 0,
      pendingRxItems: [],
      pendingRxTotal: 0,
    };
  }

  // 1. Unpaid or partially paid bills
  const patientBills = bills.filter(
    (b) => String(b.patientId) === String(patientId) && b.status !== 'Cancelled'
  );

  const unpaidBills: UnpaidBillItem[] = [];
  let unpaidBillsTotal = 0;

  patientBills.forEach((b) => {
    const due =
      b.patientDueAmount !== undefined
        ? Number(b.patientDueAmount)
        : Number(b.totalAmount || 0) - Number(b.paidAmount || 0);

    if (due > 0.01) {
      unpaidBills.push({
        id: b.id,
        invoiceNo: b.invoiceNo || b.id,
        date: b.date || '',
        totalAmount: Number(b.totalAmount || 0),
        paidAmount: Number(b.paidAmount || 0),
        dueAmount: due,
        status: b.status || 'Unpaid',
      });
      unpaidBillsTotal += due;
    }
  });

  // 2. Uninvoiced Service Orders (Services performed/ordered not yet added to a bill)
  const patientAptIds = new Set(
    appointments.filter((a) => String(a.patientId) === String(patientId)).map((a) => String(a.id))
  );

  const uninvoicedServices: UninvoicedServiceItem[] = [];
  let uninvoicedServicesTotal = 0;

  serviceOrders.forEach((so) => {
    const matchesApt = so.appointmentId && patientAptIds.has(String(so.appointmentId));
    const matchesDirect = (so as any).patientId && String((so as any).patientId) === String(patientId);

    if ((matchesApt || matchesDirect) && so.status !== 'Cancelled' && so.billingStatus === 'Pending') {
      const price = Number(so.totalPrice || (so.unitPrice || 0) * (so.quantity || 1));
      uninvoicedServices.push({
        id: so.id,
        serviceName: so.serviceName || 'Medical Service',
        quantity: so.quantity || 1,
        unitPrice: Number(so.unitPrice || 0),
        totalPrice: price,
        orderDate: so.orderDate || '',
        status: so.status || 'Ordered',
        serviceCenter: so.serviceCenter,
      });
      uninvoicedServicesTotal += price;
    }
  });

  // 3. Pending Pharmacy Prescriptions (Ordered but not dispensed or paid)
  const pendingRxItems: PendingPrescriptionItem[] = [];
  let pendingRxTotal = 0;

  const patientPrescriptions = prescriptions.filter(
    (rx) =>
      String(rx.patientId) === String(patientId) &&
      rx.status !== 'Cancelled' &&
      rx.status !== 'Dispensed'
  );

  patientPrescriptions.forEach((rx) => {
    (rx.items || [])
      .filter((item) => item.status === 'Pending')
      .forEach((item) => {
        const itemQty = Number(item.totalQty || (item as any).quantity || 1);
        const itemPrice = Number(item.totalAmount ?? ((item.unitPrice ?? 0) * itemQty));
        pendingRxItems.push({
          id: item.id,
          medicineName: item.itemName || item.genericName || (item as any).drugName || 'Medication',
          quantity: itemQty,
          totalAmount: itemPrice,
          prescriptionDate: rx.orderDate || '',
        });
        pendingRxTotal += itemPrice;
      });
  });

  const totalPendingDue = unpaidBillsTotal + uninvoicedServicesTotal + pendingRxTotal;

  return {
    patientId,
    totalPendingDue,
    hasDues: totalPendingDue > 0.01,
    unpaidBills,
    unpaidBillsTotal,
    uninvoicedServices,
    uninvoicedServicesTotal,
    pendingRxItems,
    pendingRxTotal,
  };
}
