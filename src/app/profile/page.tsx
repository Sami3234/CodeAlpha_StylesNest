'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/context/LoginModalContext';
import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PasswordStrengthList from '@/components/auth/PasswordStrengthList';
import { providerLabel } from '@/lib/shop-users-labels';
import { writeCustomerDetailsToSession } from '@/lib/customer-details-storage';
import { passwordsMatch, validatePasswordStrength } from '@/lib/password-policy';
import { clientMessageFromApi } from '@/lib/safe-errors';
import {
  IoArrowBack,
  IoLocationOutline,
  IoLockClosedOutline,
  IoLogOutOutline,
  IoPersonCircleOutline,
  IoStorefrontOutline,
} from 'react-icons/io5';
import './profile.css';

type ProfileForm = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { openLogin } = useLoginModal();

  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    phone: '',
    city: '',
    address: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const isEmailAccount = session?.user?.authProvider === 'credentials';

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/account/profile', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.profile) {
        setForm({
          fullName: data.profile.fullName ?? session?.user?.name ?? '',
          phone: data.profile.phone ?? '',
          city: data.profile.city ?? '',
          address: data.profile.address ?? '',
        });
      } else if (session?.user?.name) {
        setForm((f) => ({ ...f, fullName: session.user?.name ?? '' }));
      }
    } catch {
      setMessage({ type: 'err', text: 'Could not load profile' });
    } finally {
      setLoadingProfile(false);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      openLogin('/profile');
    }
  }, [status, router, openLogin]);

  useEffect(() => {
    if (status === 'authenticated') {
      void loadProfile();
    }
  }, [status, loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: clientMessageFromApi(data, 'Save failed') });
        return;
      }

      writeCustomerDetailsToSession({
        fullName: form.fullName,
        mobile: form.phone,
        city: form.city,
        address: form.address,
      });

      await update({ name: form.fullName });
      setMessage({ type: 'ok', text: 'Your delivery details were saved.' });
    } catch {
      setMessage({ type: 'err', text: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!passwordsMatch(newPassword, confirmPassword)) {
      setPasswordMessage({ type: 'err', text: 'New passwords do not match' });
      return;
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      setPasswordMessage({ type: 'err', text: pwCheck.errors.join('. ') });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage({ type: 'err', text: clientMessageFromApi(data, 'Could not update password') });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'ok', text: 'Password updated successfully.' });
    } catch {
      setPasswordMessage({ type: 'err', text: 'Could not update password' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (status === 'loading' || loadingProfile) {
    return (
      <div className="profile-page-root">
        <Header />
        <main className="profile-page">
          <div className="profile-page__inner">
            <div className="profile-skeleton" aria-hidden>
              <div className="profile-skeleton__sidebar" />
              <div className="profile-skeleton__main" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!session?.user) return null;

  const method = providerLabel(session.user.authProvider ?? 'credentials');
  const displayName = form.fullName || session.user.name || 'Your account';

  return (
    <div className="profile-page-root">
      <Header />
      <main className="profile-page">
        <div className="profile-page__inner">
          <header className="profile-page__header">
            <Link href="/shop" className="profile-back">
              <IoArrowBack size={18} aria-hidden />
              Back to shop
            </Link>
            <h1 className="profile-page__title">My account</h1>
            <p className="profile-page__subtitle">Manage delivery details and account security</p>
          </header>

          <div className="profile-layout">
            <aside className="profile-sidebar">
              <div className="profile-sidebar__card">
                <div className="profile-sidebar__avatar-wrap">
                  <div className="profile-avatar">
                    <IoPersonCircleOutline size={52} color="#94a3b8" aria-hidden />
                  </div>
                </div>
                <h2 className="profile-sidebar__name">{displayName}</h2>
                <p className="profile-sidebar__email">{session.user.email}</p>
                <span className="profile-badge">{method}</span>

                <nav className="profile-sidebar__nav" aria-label="Account shortcuts">
                  <Link href="/shop" className="profile-sidebar__link">
                    <IoStorefrontOutline size={20} aria-hidden />
                    Continue shopping
                  </Link>
                  <button
                    type="button"
                    className="profile-sidebar__link profile-sidebar__link--muted"
                    onClick={() => void signOut({ callbackUrl: '/' })}
                  >
                    <IoLogOutOutline size={20} aria-hidden />
                    Sign out
                  </button>
                </nav>
              </div>
            </aside>

            <div className="profile-main">
              {message ? (
                <p className={`profile-msg profile-msg--${message.type === 'ok' ? 'ok' : 'err'}`} role="status">
                  {message.text}
                </p>
              ) : null}

              <section className="profile-panel" aria-labelledby="delivery-heading">
                <div className="profile-panel__head">
                  <span className="profile-panel__icon" aria-hidden>
                    <IoLocationOutline size={22} />
                  </span>
                  <div>
                    <h2 id="delivery-heading" className="profile-panel__title">
                      Delivery details
                    </h2>
                    <p className="profile-panel__desc">Used when you place an order</p>
                  </div>
                </div>

                <form className="profile-form" onSubmit={handleSave}>
                  <div className="profile-form__grid">
                    <label className="profile-form__field profile-form__field--full">
                      Full name *
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        autoComplete="name"
                      />
                    </label>
                    <label className="profile-form__field">
                      WhatsApp / mobile *
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        autoComplete="tel"
                        placeholder="03XX XXXXXXX"
                      />
                    </label>
                    <label className="profile-form__field">
                      City *
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        autoComplete="address-level2"
                      />
                    </label>
                    <label className="profile-form__field profile-form__field--full">
                      Delivery address *
                      <textarea
                        required
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        autoComplete="street-address"
                        placeholder="House no, street, area…"
                        rows={3}
                      />
                    </label>
                  </div>
                  <div className="profile-panel__actions">
                    <button type="submit" className="profile-btn profile-btn--primary" disabled={saving}>
                      {saving ? 'Saving…' : 'Save delivery details'}
                    </button>
                  </div>
                </form>
              </section>

              {isEmailAccount ? (
                <section className="profile-panel" aria-labelledby="password-heading">
                  <div className="profile-panel__head">
                    <span className="profile-panel__icon profile-panel__icon--security" aria-hidden>
                      <IoLockClosedOutline size={22} />
                    </span>
                    <div>
                      <h2 id="password-heading" className="profile-panel__title">
                        Password
                      </h2>
                      <p className="profile-panel__desc">Update your sign-in password</p>
                    </div>
                  </div>

                  {passwordMessage ? (
                    <p
                      className={`profile-msg profile-msg--${passwordMessage.type === 'ok' ? 'ok' : 'err'}`}
                      role="status"
                    >
                      {passwordMessage.text}
                    </p>
                  ) : null}

                  <form className="profile-form" onSubmit={handlePasswordChange}>
                    <div className="profile-form__grid">
                      <label className="profile-form__field profile-form__field--full">
                        Current password
                        <input
                          type="password"
                          required
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </label>
                      <label className="profile-form__field">
                        New password
                        <input
                          type="password"
                          required
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </label>
                      <label className="profile-form__field">
                        Confirm new password
                        <input
                          type="password"
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </label>
                    </div>
                    <PasswordStrengthList
                      password={newPassword}
                      confirmPassword={confirmPassword}
                      showMatch
                    />
                    <div className="profile-panel__actions">
                      <button type="submit" className="profile-btn profile-btn--outline" disabled={savingPassword}>
                        {savingPassword ? 'Updating…' : 'Update password'}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              <div className="profile-mobile-actions" aria-label="Quick actions">
                <Link href="/shop" className="profile-btn profile-btn--secondary">
                  Continue shopping
                </Link>
                <button
                  type="button"
                  className="profile-btn profile-btn--ghost"
                  onClick={() => void signOut({ callbackUrl: '/' })}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
