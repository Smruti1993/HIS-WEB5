/**
 * ConfirmationCard.tsx
 *
 * Visual confirmation card rendered in assistant messages when an appointment
 * is prepared and waiting for explicit user confirmation.
 */
import React, { useState } from 'react';
import { Calendar, Clock, User, Stethoscope, Building, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export interface PendingActionData {
  actionId: string;
  patientName?: string;
  doctorName?: string;
  department?: string;
  date?: string;
  time?: string;
  details?: Record<string, unknown>;
}

interface ConfirmationCardProps {
  action: PendingActionData;
  onConfirm: (actionId: string) => Promise<{ success: boolean; message: string }>;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({ action, onConfirm }) => {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'cancelled' | 'error'>('pending');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const handleConfirm = async () => {
    setStatus('confirming');
    const res = await onConfirm(action.actionId);
    if (res.success) {
      setStatus('confirmed');
      setFeedbackMessage(res.message);
    } else {
      setStatus('error');
      setFeedbackMessage(res.message);
    }
  };

  const handleCancel = () => {
    setStatus('cancelled');
    setFeedbackMessage('Appointment booking was cancelled.');
  };

  return (
    <div className="mt-3 p-4 bg-white rounded-xl border border-blue-200 shadow-sm text-slate-800 text-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <span className="font-semibold text-blue-900 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" />
          Appointment Details
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Pending Confirmation
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-600 mb-4">
        {action.patientName && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Patient:</span>
            <span>{action.patientName}</span>
          </div>
        )}
        {action.doctorName && (
          <div className="flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Doctor:</span>
            <span>{action.doctorName}</span>
          </div>
        )}
        {action.department && (
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Department:</span>
            <span>{action.department}</span>
          </div>
        )}
        <div className="flex items-center gap-4 pt-1">
          {action.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{action.date}</span>
            </div>
          )}
          {action.time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{action.time}</span>
            </div>
          )}
        </div>
      </div>

      {status === 'pending' && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleConfirm}
            className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm Booking
          </button>
          <button
            onClick={handleCancel}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {status === 'confirming' && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-blue-600 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Confirming appointment with hospital records...</span>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage || 'Appointment confirmed successfully!'}</span>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 text-slate-600 rounded-lg text-xs border border-slate-200">
          <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{feedbackMessage || 'Failed to book appointment. Slot may no longer be available.'}</span>
        </div>
      )}
    </div>
  );
};

