import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  label, value, onChange, minDate, maxDate, placeholder, className 
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize viewDate based on value or today
  useEffect(() => {
    if (value) {
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
    // Use rigid formatting to avoid timezone slips
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateString);
    setShowCalendar(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    // Create date object at noon to avoid timezone rolling back
    const date = new Date(y, m - 1, d, 12, 0, 0); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days = [];
  // Empty slots
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  
  // Day buttons
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = value === dateString;
    const isToday = todayString === dateString;
    const isPast = minDate && dateString < minDate;
    const isFuture = maxDate && dateString > maxDate;
    const isDisabled = isPast || isFuture;

    days.push(
      <button
        type="button"
        key={d}
        disabled={!!isDisabled}
        onClick={() => handleDateClick(d)}
        className={`
          w-9 h-9 text-xs font-medium rounded-full flex items-center justify-center transition-all duration-200
          ${isSelected 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-bold scale-105' 
            : isDisabled
              ? 'text-slate-300 cursor-not-allowed bg-slate-50' 
              : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
          }
          ${!isSelected && isToday ? 'border border-blue-600 text-blue-600 font-bold' : ''}
        `}
      >
        {d}
      </button>
    );
  }

  const clearDate = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
  };

  return (
    <div className={`relative ${className || ''}`} ref={containerRef}>
      {label && <label className="form-label mb-1.5">{label}</label>}
      <div 
        onClick={() => setShowCalendar(!showCalendar)}
        className={`
            w-full bg-white border rounded-xl px-4 py-2.5 text-left flex items-center justify-between cursor-pointer transition-all shadow-sm
            ${showCalendar ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300 hover:border-blue-400'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
             <CalendarIcon className={`w-5 h-5 shrink-0 ${value ? 'text-blue-600' : 'text-slate-400'}`} />
             <span className={`text-sm truncate ${value ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                {value ? formatDateDisplay(value) : (placeholder || 'Select Date')}
            </span>
        </div>
        
        {value ? (
             <button 
                onClick={clearDate}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
             >
                 <X className="w-4 h-4" />
             </button>
        ) : (
             <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
        )}
      </div>

      {showCalendar && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-[60] p-4 w-[320px] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4 px-1">
            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[11px] font-bold text-slate-400 uppercase py-1">
                    {day}
                </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
             <button 
                type="button"
                onClick={() => {
                    const today = new Date();
                    const tStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    onChange(tStr);
                    setViewDate(today);
                    setShowCalendar(false);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
             >
                 Select Today
             </button>
          </div>
        </div>
      )}
    </div>
  );
};