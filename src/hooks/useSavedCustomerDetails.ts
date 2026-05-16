'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  profileToCustomerDetails,
  writeCustomerDetailsToSession,
  type CustomerDetails,
} from '@/lib/customer-details-storage';

type FormSlice = Pick<CustomerDetails, 'fullName' | 'mobile' | 'city' | 'address'>;

/**
 * When logged in, loads saved profile from DB and merges into order form + sessionStorage.
 */
export function useSavedCustomerDetails<T extends FormSlice>(
  setFormData: React.Dispatch<React.SetStateAction<T>>,
  enabled = true
) {
  const { status } = useSession();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!enabled || status !== 'authenticated' || appliedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/account/profile', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const profile = data.profile as
          | { fullName?: string; phone?: string; city?: string; address?: string }
          | null;
        if (!profile || cancelled) return;

        const hasSaved =
          Boolean(profile.fullName?.trim()) &&
          Boolean(profile.phone?.trim()) &&
          Boolean(profile.city?.trim()) &&
          Boolean(profile.address?.trim());

        if (!hasSaved) return;

        const details = profileToCustomerDetails({
          fullName: profile.fullName ?? '',
          phone: profile.phone ?? '',
          city: profile.city ?? '',
          address: profile.address ?? '',
        });

        writeCustomerDetailsToSession(details);

        setFormData((prev) => ({
          ...prev,
          fullName: details.fullName || prev.fullName,
          mobile: details.mobile || prev.mobile,
          city: details.city || prev.city,
          address: details.address || prev.address,
        }));

        appliedRef.current = true;
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, status, setFormData]);
}
