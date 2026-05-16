'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PAYMENT_METHODS,
  paymentTypeLabel,
  type PaymentMethod,
  type PaymentMethodType,
} from '@/lib/payment-methods';
import '@/components/admin-payment-methods.css';

const TYPES: PaymentMethodType[] = ['cod', 'jazzcash', 'easypaisa', 'bank', 'other'];

function newId() {
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/payment-methods');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load');
        setMethods(DEFAULT_PAYMENT_METHODS);
        return;
      }
      setMethods(data.methods?.length ? data.methods : DEFAULT_PAYMENT_METHODS);
    } catch {
      setError('Failed to load payment methods');
      setMethods(DEFAULT_PAYMENT_METHODS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateMethod = (id: string, patch: Partial<PaymentMethod>) => {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const addMethod = () => {
    setMethods((prev) => [
      ...prev,
      {
        id: newId(),
        type: 'jazzcash',
        label: 'New payment method',
        active: true,
        sortOrder: prev.length,
      },
    ]);
  };

  const removeMethod = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methods }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Save failed');
        return;
      }
      setMethods(data.methods);
      setSuccess('Payment methods saved successfully.');
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-pm-loading">Loading…</div>;
  }

  return (
    <div className="admin-pm-page">
      <div style={{ marginBottom: 24 }}>
        <h1>Payment methods</h1>
        <p className="admin-pm-subtitle">
          Manage JazzCash, EasyPaisa, bank accounts, and cash on delivery shown on the order form.
        </p>
      </div>

      {success ? <div className="admin-pm-alert-success">{success}</div> : null}
      {error ? <div className="admin-pm-alert-error">{error}</div> : null}

      <div className="admin-pm-actions">
        <button type="button" onClick={addMethod} className="admin-pm-btn-add">
          + Add method
        </button>
        <button type="button" onClick={save} disabled={saving} className="admin-pm-btn-save">
          {saving ? 'Saving…' : 'Save all'}
        </button>
      </div>

      <div className="admin-pm-list">
        {methods.map((method) => (
          <div key={method.id} className="admin-pm-card">
            <div className="admin-pm-card-header">
              <label className="admin-pm-check-label">
                <input
                  type="checkbox"
                  checked={method.active}
                  onChange={(e) => updateMethod(method.id, { active: e.target.checked })}
                />
                Active on storefront
              </label>
              <button type="button" onClick={() => removeMethod(method.id)} className="admin-pm-remove">
                Remove
              </button>
            </div>

            <div className="admin-pm-grid">
              <div className="admin-pm-field">
                <label>Type</label>
                <select
                  className="admin-pm-select"
                  value={method.type}
                  onChange={(e) =>
                    updateMethod(method.id, { type: e.target.value as PaymentMethodType })
                  }
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {paymentTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-pm-field">
                <label>Label *</label>
                <input
                  className="admin-pm-input"
                  value={method.label}
                  onChange={(e) => updateMethod(method.id, { label: e.target.value })}
                  placeholder="e.g. JazzCash"
                />
              </div>
              <div className="admin-pm-field">
                <label>Account title</label>
                <input
                  className="admin-pm-input"
                  value={method.accountTitle ?? ''}
                  onChange={(e) => updateMethod(method.id, { accountTitle: e.target.value })}
                />
              </div>
              <div className="admin-pm-field">
                <label>Number / account</label>
                <input
                  className="admin-pm-input"
                  value={method.accountNumber ?? ''}
                  onChange={(e) => updateMethod(method.id, { accountNumber: e.target.value })}
                  placeholder="03XX or account no."
                />
              </div>
              {method.type === 'bank' ? (
                <>
                  <div className="admin-pm-field">
                    <label>Bank name</label>
                    <input
                      className="admin-pm-input"
                      value={method.bankName ?? ''}
                      onChange={(e) => updateMethod(method.id, { bankName: e.target.value })}
                    />
                  </div>
                  <div className="admin-pm-field">
                    <label>IBAN</label>
                    <input
                      className="admin-pm-input"
                      value={method.iban ?? ''}
                      onChange={(e) => updateMethod(method.id, { iban: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
            </div>
            <div className="admin-pm-field admin-pm-instructions">
              <label>Instructions for customer</label>
              <textarea
                className="admin-pm-textarea"
                value={method.instructions ?? ''}
                onChange={(e) => updateMethod(method.id, { instructions: e.target.value })}
                rows={2}
                placeholder="e.g. Send payment and confirm on WhatsApp"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
