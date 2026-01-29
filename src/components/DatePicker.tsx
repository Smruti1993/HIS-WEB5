import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, minDate, placeholder }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      // Parse YYYY-MM-DD correctly without timezone issues
      const [y, m, d] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    // Format YYYY-MM-DD
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateString);
    setShowCalendar(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = [];
  // Empty slots for previous month days
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  
  // Day buttons
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = value === dateString;
    const isPast = minDate && dateString < minDate;

    days.push(
      <button
        type="button"
        key={d}
        disabled={!!isPast}
        onClick={() => handleDateClick(d)}
        className={`
          w-8 h-8 rounded-full text-xs font-semibold transition-all flex items-center justify-center
          ${isSelected 
            ? 'bg-blue-600 text-white shadow-md scale-105' 
            : isPast 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
          }
        `}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="form-label">{label}</label>}
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className={`
            w-full bg-white border rounded-lg px-3 py-2 text-left flex items-center justify-between transition-all
            ${showCalendar ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300 hover:border-slate-400'}
        `}
      >
        <span className={`text-sm ${value ? 'text-slate-900' : 'text-slate-500'}`}>
            {value ? formatDateDisplay(value) : (placeholder || 'Select a date')}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400" />
      </button>

      {showCalendar && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-800">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2 border-b border-slate-100 pb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-400 py-1">
                    {day}
                </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      )}
    </div>
  );
};