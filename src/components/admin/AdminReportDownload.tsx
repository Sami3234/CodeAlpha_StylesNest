'use client';

import { useState } from 'react';
import { IoDownloadOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { downloadAdminReportPdf } from '@/lib/admin-report-pdf';
import type { AdminReportPayload } from '@/lib/admin-business-report';
import './admin-report-download.css';

export default function AdminReportDownload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const handleDownload = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/report');
      const data = (await response.json()) as {
        success?: boolean;
        report?: AdminReportPayload;
        error?: string;
      };

      if (!response.ok || !data.success || !data.report) {
        setError(data.error || 'Could not load report data');
        return;
      }

      downloadAdminReportPdf(data.report);
      setLastGenerated(data.report.generatedAt);
    } catch {
      setError('Network error while preparing report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ard-card" aria-labelledby="admin-report-heading">
      <div className="ard-card__head">
        <div className="ard-card__icon" aria-hidden>
          <IoDocumentTextOutline size={22} />
        </div>
        <div>
          <h2 id="admin-report-heading" className="ard-card__title">
            Download Business Report
          </h2>
          <p className="ard-card__sub">
            Full PDF with products, orders, revenue, investment, profit &amp; loss summary
          </p>
        </div>
      </div>

      <ul className="ard-list">
        <li>Executive summary — revenue, investment, profit, loss &amp; store totals</li>
        <li>Product table — ID, name, category, price, cost, stock, sold, status</li>
        <li>Order table + line details — customer, payment, products &amp; address</li>
      </ul>

      {error ? (
        <p className="ard-error" role="alert">
          {error}
        </p>
      ) : null}

      {lastGenerated ? (
        <p className="ard-success">
          Last downloaded:{' '}
          {new Date(lastGenerated).toLocaleString('en-PK', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      ) : null}

      <button
        type="button"
        className="ard-btn"
        onClick={() => void handleDownload()}
        disabled={loading}
      >
        <IoDownloadOutline size={18} aria-hidden />
        {loading ? 'Preparing PDF…' : 'Download PDF Report'}
      </button>
    </section>
  );
}
