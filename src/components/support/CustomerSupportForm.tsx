'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { notifyError, notifySuccess } from '@/lib/notify';
import { clientMessageFromApi } from '@/lib/safe-errors';
import './customer-support-form.css';

export default function CustomerSupportForm() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? '');
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = clientMessageFromApi(data, 'Could not send your message. Please try again.');
        setErrorText(msg);
        notifyError(msg);
        return;
      }

      const msg =
        data.message ??
        'Thank you! Our customer support team will contact you soon.';
      setSuccessText(msg);
      notifySuccess(msg);
      setSubject('');
      setMessage('');
    } catch {
      const msg = 'Network error. Please check your connection and try again.';
      setErrorText(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="csf-card" id="customer-support">
      <h3 className="csf-title">Customer support</h3>
      <p className="csf-sub">
        Need help with an order, product, or account? Send us a message and our team will get back
        to you as soon as possible.
      </p>

      <form className="csf-grid" onSubmit={handleSubmit}>
        <div className="csf-field">
          <label className="csf-label" htmlFor="support-name">
            Your name *
          </label>
          <input
            id="support-name"
            className="csf-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            autoComplete="name"
          />
        </div>

        <div className="csf-field">
          <label className="csf-label" htmlFor="support-email">
            Email
          </label>
          <input
            id="support-email"
            type="email"
            className="csf-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={160}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="csf-field">
          <label className="csf-label" htmlFor="support-phone">
            Phone (WhatsApp)
          </label>
          <input
            id="support-phone"
            type="tel"
            className="csf-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={24}
            autoComplete="tel"
            placeholder="03XXXXXXXXX"
          />
        </div>

        <div className="csf-field">
          <label className="csf-label" htmlFor="support-subject">
            Subject *
          </label>
          <input
            id="support-subject"
            className="csf-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={160}
          />
        </div>

        <div className="csf-field csf-field--full">
          <label className="csf-label" htmlFor="support-message">
            How can we help? *
          </label>
          <textarea
            id="support-message"
            className="csf-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            maxLength={4000}
            placeholder="Describe your issue or question..."
          />
        </div>

        <div className="csf-field csf-field--full csf-actions">
          <button type="submit" className="csf-submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send to support'}
          </button>
          {errorText ? <p className="csf-error">{errorText}</p> : null}
          {successText ? <p className="csf-success">{successText}</p> : null}
        </div>
      </form>
    </div>
  );
}
