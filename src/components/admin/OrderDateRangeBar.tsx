'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cities, getCityName } from '@/data/products';
import {
  firstDayOfMonthKey,
  getTodayDateInTimezone,
  shiftDateKey,
} from '@/lib/order-date';

type Props = {
  filterToday: boolean;
  onClearToday: () => void;
};

const selectStyle: React.CSSProperties = {
  padding: '8px 32px 8px 10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '13px',
  fontWeight: 600,
  color: '#1E293B',
  backgroundColor: '#f8fafc',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  minWidth: '110px',
};

const presetBtn = (active: boolean): React.CSSProperties => ({
  padding: '7px 12px',
  borderRadius: '8px',
  border: active ? '2px solid #1E293B' : '1px solid #cbd5e1',
  backgroundColor: active ? '#1E293B' : '#fff',
  color: active ? '#fff' : '#475569',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

function pushParams(router: ReturnType<typeof useRouter>, params: URLSearchParams) {
  params.delete('page');
  const qs = params.toString();
  router.push(qs ? `/khanadmin/orders?${qs}` : '/khanadmin/orders');
}

export default function OrderDateRangeBar({ filterToday, onClearToday }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const city = searchParams.get('city') ?? 'all';
  const paystatus = searchParams.get('paystatus') ?? 'all';
  const today = getTodayDateInTimezone();

  const preset =
    filterToday
      ? 'today'
      : from === shiftDateKey(today, -6) && to === today
        ? '7d'
        : from === shiftDateKey(today, -29) && to === today
          ? '30d'
          : from === firstDayOfMonthKey(today) && to === today
            ? 'month'
            : null;

  const applyRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('period');
    if (from) params.set('from', from);
    else params.delete('from');
    if (to) params.set('to', to);
    else params.delete('to');
    pushParams(router, params);
  };

  const clearRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    params.delete('to');
    params.delete('period');
    pushParams(router, params);
  };

  const applyPreset = (key: 'today' | '7d' | '30d' | 'month') => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('period');
    if (key === 'today') {
      params.set('period', 'today');
      params.delete('from');
      params.delete('to');
    } else if (key === '7d') {
      params.set('from', shiftDateKey(today, -6));
      params.set('to', today);
    } else if (key === '30d') {
      params.set('from', shiftDateKey(today, -29));
      params.set('to', today);
    } else {
      params.set('from', firstDayOfMonthKey(today));
      params.set('to', today);
    }
    pushParams(router, params);
  };

  const setCity = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('city');
    else params.set('city', value);
    pushParams(router, params);
  };

  const setPayStatus = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('paystatus');
    else params.set('paystatus', value);
    pushParams(router, params);
  };

  const clearAllBarFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    params.delete('to');
    params.delete('period');
    params.delete('city');
    params.delete('paystatus');
    pushParams(router, params);
    if (filterToday) onClearToday();
  };

  const hasBarFilters =
    filterToday || from || to || (city && city !== 'all') || (paystatus && paystatus !== 'all');

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px 14px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Quick date presets */}
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Quick</span>
      {(
        [
          ['today', 'Today'],
          ['7d', '7 days'],
          ['30d', '30 days'],
          ['month', 'This month'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => applyPreset(key)}
          style={presetBtn(preset === key || (key === 'today' && filterToday))}
        >
          {label}
        </button>
      ))}

      <span
        style={{
          width: '1px',
          height: '28px',
          backgroundColor: '#e2e8f0',
          margin: '0 2px',
          flexShrink: 0,
        }}
        aria-hidden
      />

      {/* Custom date range */}
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>From</span>
      <input
        type="date"
        value={from}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete('period');
          if (e.target.value) params.set('from', e.target.value);
          else params.delete('from');
          pushParams(router, params);
        }}
        style={{
          padding: '8px 10px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontSize: '13px',
        }}
      />
      <span style={{ color: '#94a3b8', fontSize: '13px' }}>to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete('period');
          if (e.target.value) params.set('to', e.target.value);
          else params.delete('to');
          pushParams(router, params);
        }}
        style={{
          padding: '8px 10px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontSize: '13px',
        }}
      />
      <button type="button" onClick={applyRange} style={presetBtn(false)}>
        Apply
      </button>

      <span
        style={{
          width: '1px',
          height: '28px',
          backgroundColor: '#e2e8f0',
          margin: '0 2px',
          flexShrink: 0,
        }}
        aria-hidden
      />

      {/* City */}
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        aria-label="Filter by city"
        style={{ ...selectStyle, minWidth: '120px' }}
      >
        <option value="all">All cities</option>
        {cities.map((c, idx) => {
          const name = getCityName(c);
          return (
            <option key={`${name}-${idx}`} value={name}>
              {name}
            </option>
          );
        })}
      </select>

      {/* Payment status */}
      <select
        value={paystatus}
        onChange={(e) => setPayStatus(e.target.value)}
        aria-label="Filter by payment status"
        style={{ ...selectStyle, minWidth: '130px' }}
      >
        <option value="all">All pay status</option>
        <option value="cod">COD (on delivery)</option>
        <option value="awaiting_payment">Awaiting payment</option>
        <option value="paid">Paid</option>
      </select>

      {hasBarFilters ? (
        <button
          type="button"
          onClick={clearAllBarFilters}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#fff',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
