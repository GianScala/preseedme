"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar as CalendarIcon,
  Lock,
  AlertCircle
} from "lucide-react";

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
  bookedDates: string[]; // YYYY-MM-DD strings
  onCheckout: (selectedDates: string[], totalAmount: number, ideaId: string) => void;
}

const PRICE_PER_DAY = 2.99;
const MAX_DAYS = 30;
// Calendly-style header: Monday first
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type CalendarCell = {
  day: number;
  key: string;
  isPast: boolean;
  isBooked: boolean;
  isSelectable: boolean;
};

export default function AdvertiseModal({
  isOpen,
  onClose,
  ideaId,
  ideaTitle,
  bookedDates,
  onCheckout,
}: AdvertiseModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // YYYY-MM-DD
  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const todayStr = useMemo(() => {
    const d = new Date();
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  /**
   * Build a Calendly-style calendar:
   * - Monday is the first column.
   * - Leading & trailing empty cells are null.
   */
  const calendarCells: (CalendarCell | null)[] = useMemo(() => {
    const firstDayJs = new Date(year, month, 1).getDay(); // 0 = Sun ... 6 = Sat
    const firstDayMondayIndex = (firstDayJs + 6) % 7; // 0 = Mon ... 6 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (CalendarCell | null)[] = [];

    // Leading blanks
    for (let i = 0; i < firstDayMondayIndex; i++) {
      cells.push(null);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const key = formatDate(year, month, day);
      const isBooked = bookedDates.includes(key);
      cells.push({
        day,
        key,
        isPast: key < todayStr,
        isBooked,
        isSelectable: false, // All dates are non-selectable for now
      });
    }

    // Trailing blanks so total cells is a multiple of 7
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [year, month, bookedDates, todayStr]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset selection & month whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedDates(new Set());
      setCurrentDate(new Date());
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl">
        {/* LEFT: Info - Hidden on mobile */}
        <div className="hidden w-[40%] flex-col border-r border-white/10 bg-black/20 p-6 md:p-8 md:flex">
          <div className="mb-6 md:mb-8">
            <div className="mb-4 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <Megaphone className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Feature Your Startup
            </h2>
            <p className="mt-2 text-xs md:text-sm text-neutral-400">
              Reserve days to appear at the top of the leaderboard.
            </p>

            {ideaTitle && (
              <p className="mt-4 text-xs font-semibold text-[var(--brand)]/80">
                Featuring:{" "}
                <span className="text-[var(--brand)]">
                  {ideaTitle}
                </span>
              </p>
            )}
          </div>

          {/* Feature Status */}
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Coming Soon</h4>
                <p className="text-xs text-neutral-300">
                  This feature is currently under development. You can browse dates but selection will be available soon.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm text-neutral-300">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-4 w-4 text-neutral-500 flex-shrink-0" />
              <span>Select up to {MAX_DAYS} days</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-neutral-500 flex-shrink-0" />
              <span>${PRICE_PER_DAY.toFixed(2)} / day</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-neutral-500 flex-shrink-0" />
              <span>Booked dates are unavailable</span>
            </div>
          </div>

          <div className="mt-auto rounded-2xl bg-white/5 p-4 border border-white/5">
            <div className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">
              Coming Soon Preview
            </div>
            <div className="text-sm text-neutral-400">
              The ability to select dates will be available in the next update.
            </div>
          </div>
        </div>

        {/* RIGHT: Calendar - Full width on mobile */}
        <div className="flex flex-1 flex-col p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Close button - positioned differently for mobile */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 md:right-6 md:top-6 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* Mobile Header */}
          <div className="md:hidden mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)]">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Feature Your Startup
                </h3>
                {ideaTitle && (
                  <p className="mt-1 text-xs text-[var(--brand)]">
                    {ideaTitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Mobile status banner */}
            <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className="text-xs text-yellow-300 font-medium">Coming Soon</span>
              </div>
              <p className="text-xs text-neutral-300 mt-1">
                Browse dates now, select later
              </p>
            </div>
          </div>

          {/* Header for desktop */}
          <div className="hidden md:flex mb-6 items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Browse Available Dates
              </h3>
              <p className="mt-1 text-sm text-neutral-400">
                Preview calendar (selection disabled for now)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-neutral-300 hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[140px] md:min-w-[160px] text-center text-sm font-medium text-white">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-neutral-300 hover:bg-white/5"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile month navigation */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-300 hover:bg-white/5"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-base font-semibold text-white px-4 text-center">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-300 hover:bg-white/5"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-center text-sm text-neutral-400">
              Tap on dates to preview (selection coming soon)
            </p>
          </div>

          {/* Weekday header - responsive sizing */}
          <div className="grid grid-cols-7 gap-y-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-tight text-neutral-500 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="flex h-6 sm:h-7 items-center justify-center">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid - responsive sizing */}
          <div className="grid grid-cols-7 gap-y-1 sm:gap-y-2 gap-x-1 sm:gap-x-3 justify-items-center">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div key={`empty-${idx}`} className="h-8 w-8 sm:h-10 sm:w-10" />
                );
              }

              const { day, key, isPast, isBooked } = cell;

              const baseClasses =
                "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-all cursor-default";
              const stateClasses = isPast
                ? "text-neutral-600 opacity-30"
                : isBooked
                ? "text-neutral-400 bg-neutral-800/50 border border-red-500/30 line-through"
                : "text-neutral-300 bg-neutral-800/30";
              const tooltip = isBooked ? "Already booked" : isPast ? "Past date" : "Available soon";

              return (
                <div
                  key={key}
                  className={`${baseClasses} ${stateClasses} group relative`}
                  title={tooltip}
                >
                  {day}
                  {isBooked && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border border-neutral-900" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend - responsive */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3 text-[10px] sm:text-[11px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neutral-800 border border-white/20" />
                  <span>Available (soon)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-transparent border border-neutral-600" />
                  <span>Past date</span>
                </div>
              </div>

              {/* Coming Soon Notice */}
              <div className="sm:text-right">
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-300 text-xs px-3 py-2 rounded-lg border border-yellow-500/20">
                  <Lock className="h-3 w-3" />
                  <span>Date selection coming soon</span>
                </div>
              </div>
            </div>

            {/* Mobile info box */}
            <div className="mt-4 md:hidden rounded-xl bg-white/5 p-4 border border-white/10">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-300">Pricing Preview</span>
                <span className="font-semibold">${PRICE_PER_DAY.toFixed(2)} / day</span>
              </div>
              <p className="text-xs text-neutral-400">
                When available, select up to {MAX_DAYS} days to feature your startup
              </p>
            </div>
          </div>

          {/* Bottom buttons - mobile optimized */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Close Preview
            </button>
            <button
              disabled
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-neutral-400 cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Select Dates (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}