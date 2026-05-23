'use client';

import { useEffect, useState } from 'react';
import SocialBrandIcon from '@/components/SocialBrandIcon';
import { useContactSettings } from '@/context/ContactSettingsContext';

function waLinkFromNumber(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}`;
}

export default function TopAnnouncementBar() {
  const { settings: shared, loaded } = useContactSettings();
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

  if (!loaded) return null;

  const settings = shared;

  const announcement = (settings.announcement_text || '').trim();
  const waHref = settings.social_whatsapp.trim() || waLinkFromNumber(settings.whatsapp);
  const fb = settings.social_facebook.trim();
  const dz = settings.social_daraz.trim();
  const sp = (settings.social_shopify || '').trim();
  const hasMarquee = announcement.length > 0;
  const hasIcons = !!(fb || waHref || dz || sp);

  if (!hasMarquee && !hasIcons) return null;

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
          <div className="top-announcement-icons">
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="top-announcement-icon top-announcement-icon--wa"
              >
                <SocialBrandIcon platform="social_whatsapp" size={15} />
              </a>
            ) : null}
            {fb ? (
              <a
                href={fb}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="top-announcement-icon top-announcement-icon--fb"
              >
                <SocialBrandIcon platform="social_facebook" size={14} />
              </a>
            ) : null}
            {dz ? (
              <a
                href={dz}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Daraz"
                className="top-announcement-icon top-announcement-icon--dz"
              >
                <SocialBrandIcon platform="social_daraz" size={14} />
              </a>
            ) : null}
            {sp ? (
              <a
                href={sp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Shopify store"
                className="top-announcement-icon top-announcement-icon--sp"
              >
                <SocialBrandIcon platform="social_shopify" size={14} />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
