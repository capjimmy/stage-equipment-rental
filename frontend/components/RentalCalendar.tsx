'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { AlertCircle } from 'lucide-react';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface BlockedPeriod {
  blockedStart: string;
  blockedEnd: string;
  availableCount?: number;
}

interface RentalCalendarProps {
  blockedPeriods: BlockedPeriod[];
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export default function RentalCalendar({
  blockedPeriods,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: RentalCalendarProps) {
  const [selectingStart, setSelectingStart] = useState(true);
  // const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; message: string }>({
    show: false,
    x: 0,
    y: 0,
    message: '',
  });

  // Convert date string to Date object for comparison
  const parseDate = (dateStr: string): Date => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Check if a date is blocked
  const isDateBlocked = (date: Date): boolean => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return blockedPeriods.some((period) => {
      const start = parseDate(period.blockedStart);
      const end = parseDate(period.blockedEnd);
      return checkDate >= start && checkDate <= end;
    });
  };

  // Get blocked period info for a date
  const getBlockedPeriodInfo = (date: Date): BlockedPeriod | null => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const period = blockedPeriods.find((p) => {
      const start = parseDate(p.blockedStart);
      const end = parseDate(p.blockedEnd);
      return checkDate >= start && checkDate <= end;
    });

    return period || null;
  };

  // Handle date click
  const handleDateClick = (value: Value, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!value || Array.isArray(value)) return;

    const selectedDate = value as Date;
    const dateStr = selectedDate.toISOString().split('T')[0];

    // Check if date is blocked
    if (isDateBlocked(selectedDate)) {
      const period = getBlockedPeriodInfo(selectedDate);
      const message = period?.availableCount !== undefined
        ? `예약 불가 (잔여: ${period.availableCount}개)`
        : '예약 불가';

      // Show tooltip
      const rect = (event.target as HTMLElement)?.getBoundingClientRect();
      if (rect) {
        setTooltip({
          show: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          message,
        });
        setTimeout(() => setTooltip({ show: false, x: 0, y: 0, message: '' }), 2000);
      }
      return;
    }

    if (selectingStart) {
      onStartDateChange(dateStr);
      onEndDateChange('');
      setSelectingStart(false);
    } else {
      // Ensure end date is after start date
      if (startDate && dateStr < startDate) {
        onStartDateChange(dateStr);
        onEndDateChange('');
      } else {
        onEndDateChange(dateStr);
        setSelectingStart(true);
      }
    }
  };

  // Custom tile class name
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const classes: string[] = [];
    const dateStr = date.toISOString().split('T')[0];

    // Check if date is blocked
    if (isDateBlocked(date)) {
      classes.push('blocked-date');
    }

    // Check if date is selected as start or end
    if (startDate === dateStr) {
      classes.push('selected-start');
    }
    if (endDate === dateStr) {
      classes.push('selected-end');
    }

    // Check if date is in selected range
    if (startDate && endDate && dateStr > startDate && dateStr < endDate) {
      classes.push('in-range');
    }

    return classes.join(' ');
  };

  // Disable dates before today
  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date < today;
  };

  return (
    <div className="rental-calendar-wrapper">
      <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-violet-600 rounded"></div>
          <span>선택</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
          <span>불가</span>
        </div>
      </div>

      <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-900">
        {selectingStart ? '대여 시작일을 선택해주세요' : '대여 종료일을 선택해주세요'}
      </div>

      <Calendar
        onChange={handleDateClick}
        value={null}
        minDate={new Date()}
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        locale="ko-KR"
        formatDay={(locale, date) => date.getDate().toString()}
        className="rental-calendar"
      />

      {startDate && endDate && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-violet-50 border border-violet-200 rounded-lg">
          <div className="text-xs sm:text-sm font-medium text-violet-900">
            선택된 기간: {new Date(startDate).toLocaleDateString('ko-KR')} ~ {new Date(endDate).toLocaleDateString('ko-KR')}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AlertCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            {tooltip.message}
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
        </div>
      )}

      <style jsx global>{`
        .rental-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }

        .rental-calendar .react-calendar__navigation {
          display: flex;
          margin-bottom: 0.75rem;
        }

        @media (min-width: 640px) {
          .rental-calendar .react-calendar__navigation {
            margin-bottom: 1rem;
          }
        }

        .rental-calendar .react-calendar__navigation button {
          min-width: 40px;
          min-height: 40px;
          background: none;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        @media (min-width: 640px) {
          .rental-calendar .react-calendar__navigation button {
            min-width: 44px;
            min-height: 44px;
            font-size: 16px;
          }
        }

        .rental-calendar .react-calendar__navigation button:enabled:hover,
        .rental-calendar .react-calendar__navigation button:enabled:focus {
          background-color: #f1f5f9;
          border-radius: 0.5rem;
        }

        .rental-calendar .react-calendar__navigation button:disabled {
          opacity: 0.5;
        }

        .rental-calendar .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.625rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        @media (min-width: 640px) {
          .rental-calendar .react-calendar__month-view__weekdays {
            font-size: 0.75rem;
            margin-bottom: 0.5rem;
          }
        }

        .rental-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 0.375rem 0.25rem;
        }

        @media (min-width: 640px) {
          .rental-calendar .react-calendar__month-view__weekdays__weekday {
            padding: 0.5rem;
          }
        }

        .rental-calendar .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        .rental-calendar .react-calendar__tile {
          max-width: 100%;
          padding: 0.5rem 0.25rem;
          background: none;
          text-align: center;
          line-height: 1.25rem;
          font-size: 0.8125rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
          min-height: 40px;
          touch-action: manipulation;
        }

        @media (min-width: 640px) {
          .rental-calendar .react-calendar__tile {
            padding: 0.75rem 0.5rem;
            line-height: 1.5rem;
            font-size: 0.875rem;
            border-radius: 0.5rem;
            min-height: auto;
          }
        }

        .rental-calendar .react-calendar__tile:enabled:hover,
        .rental-calendar .react-calendar__tile:enabled:focus {
          background-color: #f1f5f9;
        }

        .rental-calendar .react-calendar__tile:disabled {
          background-color: #f8fafc;
          color: #cbd5e1;
          cursor: not-allowed;
        }

        .rental-calendar .react-calendar__tile--now {
          background: #dbeafe;
          font-weight: 600;
        }

        .rental-calendar .react-calendar__tile--now:enabled:hover,
        .rental-calendar .react-calendar__tile--now:enabled:focus {
          background: #bfdbfe;
        }

        .rental-calendar .blocked-date {
          background-color: #fee2e2 !important;
          color: #dc2626 !important;
          font-weight: 600;
          cursor: not-allowed !important;
          position: relative;
        }

        .rental-calendar .blocked-date:enabled:hover {
          background-color: #fecaca !important;
        }

        .rental-calendar .selected-start,
        .rental-calendar .selected-end {
          background-color: #7c3aed !important;
          color: white !important;
          font-weight: 600;
        }

        .rental-calendar .selected-start:enabled:hover,
        .rental-calendar .selected-end:enabled:hover {
          background-color: #6d28d9 !important;
        }

        .rental-calendar .in-range {
          background-color: #ede9fe !important;
          color: #5b21b6 !important;
        }

        .rental-calendar .react-calendar__month-view__days__day--weekend {
          color: #dc2626;
        }

        .rental-calendar .react-calendar__month-view__days__day--neighboringMonth {
          color: #cbd5e1;
        }

        .rental-calendar .react-calendar__tile--active {
          background: #7c3aed;
          color: white;
        }

        .rental-calendar .react-calendar__tile--active:enabled:hover,
        .rental-calendar .react-calendar__tile--active:enabled:focus {
          background: #6d28d9;
        }
      `}</style>
    </div>
  );
}
