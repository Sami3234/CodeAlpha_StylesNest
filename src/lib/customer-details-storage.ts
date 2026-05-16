export type CustomerDetails = {
  fullName: string;
  mobile: string;
  city: string;
  address: string;
  quantity?: string;
};

const STORAGE_KEY = 'stylesnest_customer_details';

export function readCustomerDetailsFromSession(): Partial<CustomerDetails> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<CustomerDetails>;
  } catch {
    return null;
  }
}

export function writeCustomerDetailsToSession(details: Partial<CustomerDetails>) {
  if (typeof window === 'undefined') return;
  try {
    const existing = readCustomerDetailsFromSession() ?? {};
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...existing,
        ...details,
      })
    );
  } catch {
    // ignore
  }
}

export function profileToCustomerDetails(profile: {
  fullName: string;
  phone: string;
  city: string;
  address: string;
}): CustomerDetails {
  return {
    fullName: profile.fullName,
    mobile: profile.phone,
    city: profile.city,
    address: profile.address,
  };
}
