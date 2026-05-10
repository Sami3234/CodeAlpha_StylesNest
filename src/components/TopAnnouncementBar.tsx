'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaFacebookF, FaWhatsapp, FaShoppingBag } from 'react-icons/fa';
import { SiShopify } from 'react-icons/si';
import { topBarUrlCaption } from '@/lib/sanitize-contact-extras';

type Settings = {
  whatsapp: string;
  announcement_text: string;
  customer_care_url: string;
  social_whatsapp: string;
  social_facebook: string;
  social_daraz: string;
  social_shopify: string;
  /** URLs only — orange bar only; captions derived automatically */
  top_bar_links?: string[];
};

function waLinkFromNumber(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}`;
}

export default function TopAnnouncementBar() {
  const [settings, setSettings] = useState<Settings | null>(null);
  /** Visible only when the page is at (or very near) scroll top; stays hidden while scrolled down */
  const [scrollCollapsed, setScrollCollapsed] = useState(false);

  useEffect(() => {
    const TOP_EPS_PX = 20;
    const apply = () => {
      setScrollCollapsed(window.scrollY > TOP_EPS_PX);
    };
    apply();
    window.addEventListener('scroll', apply, { passive: true });
    return () => window.removeEventListener('scroll', apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/contact-settings');
        const data = await res.json();
        if (!cancelled && data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch {
        if (!cancelled) setSettings(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings) return null;

  const announcement = (settings.announcement_text || '').trim();
  const careHref = (settings.customer_care_url || '').trim();
  const waHref = settings.social_whatsapp.trim() || waLinkFromNumber(settings.whatsapp);
  const fb = settings.social_facebook.trim();
  const dz = settings.social_daraz.trim();
  const sp = (settings.social_shopify || '').trim();
  const extraUrls = (settings.top_bar_links ?? []).filter((u) => typeof u === 'string' && u.trim());

  const hasMarquee = announcement.length > 0;
  const hasCare = careHref.length > 0;
  const hasIcons = !!(fb || waHref || dz || sp);
  const hasExtraLinks = extraUrls.length > 0;

  if (!hasMarquee && !hasCare && !hasIcons && !hasExtraLinks) return null;

  const careInternal = careHref.startsWith('/') && !careHref.startsWith('//');

  return (
    <div
      className={`top-announcement-bar-shell${scrollCollapsed ? ' top-announcement-bar-shell--collapsed' : ''}`}
      aria-hidden={scrollCollapsed}
    >
      <div className="top-announcement-bar">
      <div className="top-announcement-inner">
        <div className="top-announcement-marquee" aria-hidden={!hasMarquee}>
          {hasMarquee ? (
            <div className="top-announcement-track">
              <span className="top-announcement-text">{announcement}</span>
              <span className="top-announcement-text" aria-hidden>
                {announcement}
              </span>
            </div>
          ) : (
            <span className="top-announcement-spacer" />
          )}
        </div>
        <div className="top-announcement-actions">
          {hasExtraLinks ? (
            <nav className="top-announcement-extra-links" aria-label="Promo links">
              {extraUrls.map((hrefRaw, i) => {
                const href = hrefRaw.trim();
                const internal = href.startsWith('/') && !href.startsWith('//');
                const caption = topBarUrlCaption(href);
                return internal ? (
                  <Link key={`tb-${i}-${href}`} href={href} className="top-announcement-extra-link">
                    {caption}
                  </Link>
                ) : (
                  <a
                    key={`tb-${i}-${href}`}
                    href={href}
                    className="top-announcement-extra-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {caption}
                  </a>
                );
              })}
            </nav>
          ) : null}
          {hasCare &&
            (careInternal ? (
              <Link href={careHref} className="top-announcement-care">
                Customer care
              </Link>
            ) : (
              <a
                href={careHref}
                className="top-announcement-care"
                target="_blank"
                rel="noopener noreferrer"
              >
                Customer care
              </a>
            ))}
          <div className="top-announcement-icons">
            {fb ? (
              <a
                href={fb}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="top-announcement-icon"
              >
                <FaFacebookF size={14} aria-hidden />
              </a>
            ) : null}
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="top-announcement-icon"
              >
                <FaWhatsapp size={15} aria-hidden />
              </a>
            ) : null}
            {dz ? (
              <a
                href={dz}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Daraz"
                className="top-announcement-icon"
              >
                <FaShoppingBag size={14} aria-hidden />
              </a>
            ) : null}
            {sp ? (
              <a
                href={sp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Shopify store"
                className="top-announcement-icon"
              >
                <SiShopify size={14} aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
