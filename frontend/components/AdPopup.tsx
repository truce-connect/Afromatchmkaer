"use client";

import { useEffect, useState, useCallback } from 'react';
import { fetchActiveAds, type Ad } from '@/lib/api';

const AD_INTERVAL_MS = 5 * 60 * 1000; // show a new ad every 5 minutes
const SESSION_KEY = 'afro_ad_last_shown';

export function AdPopup() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [visible, setVisible] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetchActiveAds()
      .then((result) => { if (result.length) setAds(result); })
      .catch(() => {});
  }, []);

  const pickAndShow = useCallback(() => {
    if (!ads.length) return;
    const picked = ads[Math.floor(Math.random() * ads.length)];
    setAd(picked);
    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  }, [ads]);

  useEffect(() => {
    if (!ads.length) return;

    const lastShown = Number(sessionStorage.getItem(SESSION_KEY) ?? 0);
    const elapsed = Date.now() - lastShown;

    // Show immediately if never shown this session or interval passed
    if (elapsed >= AD_INTERVAL_MS) {
      const timer = setTimeout(pickAndShow, 3000); // slight delay on first load
      return () => clearTimeout(timer);
    }

    // Otherwise schedule for the remainder of the interval
    const remaining = AD_INTERVAL_MS - elapsed;
    const timer = setTimeout(pickAndShow, remaining);
    return () => clearTimeout(timer);
  }, [ads, pickAndShow]);

  // Re-trigger every interval after dismiss
  useEffect(() => {
    if (!visible && ads.length) {
      const timer = setInterval(pickAndShow, AD_INTERVAL_MS);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [visible, ads, pickAndShow]);

  if (!visible || !ad) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#2B2B2B] shadow hover:bg-white"
          aria-label="Close ad"
        >
          ✕
        </button>

        {/* Ad image */}
        {ad.linkUrl ? (
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" onClick={() => setVisible(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.imageUrl} alt={ad.title} className="h-64 w-full object-cover" />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt={ad.title} className="h-64 w-full object-cover" />
        )}

        {/* Ad title */}
        <div className="px-5 py-4">
          <p className="text-center text-sm font-medium text-[#2B2B2B]">{ad.title}</p>
          <p className="mt-1 text-center text-xs text-[#8E4B5A]">Sponsored</p>
        </div>

        {ad.linkUrl && (
          <div className="px-5 pb-4">
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setVisible(false)}
              className="block w-full rounded-xl bg-[#C65D3B] py-2 text-center text-sm font-semibold text-white hover:bg-[#a84d30]"
            >
              Learn More
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
