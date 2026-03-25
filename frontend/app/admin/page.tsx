"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchAllAds, createAd, updateAd, deleteAd, uploadPublicFiles, type Ad } from '@/lib/api';

export default function AdminAdsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [fetching, setFetching] = useState(true);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    fetchAllAds()
      .then(setAds)
      .catch(() => setMessage('Failed to load ads.'))
      .finally(() => setFetching(false));
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageFile) { setMessage('Title and image are required.'); return; }
    setSubmitting(true);
    setMessage(null);
    try {
      const { files } = await uploadPublicFiles([imageFile], 'profile');
      const imageUrl = files[0].url;
      const ad = await createAd({ title, imageUrl, linkUrl: linkUrl || undefined });
      setAds((prev) => [ad, ...prev]);
      setTitle(''); setLinkUrl(''); setImageFile(null); setImagePreview(null);
      if (fileRef.current) fileRef.current.value = '';
      setMessage('Ad created successfully.');
    } catch {
      setMessage('Failed to create ad.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      const updated = await updateAd(ad._id, { active: !ad.active });
      setAds((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    } catch {
      setMessage('Failed to update ad.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    try {
      await deleteAd(id);
      setAds((prev) => prev.filter((a) => a._id !== id));
    } catch {
      setMessage('Failed to delete ad.');
    }
  };

  if (loading || !user) return null;
  if (user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-[#F7F4EF] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-[#2B2B2B]">Admin — Manage Ads</h1>

        {/* Create Ad Form */}
        <form onSubmit={handleCreate} className="mb-10 rounded-2xl border border-[#F5D0E6] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2B2B2B]">Upload New Ad</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[#8E4B5A]">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Find your match today"
              className="w-full rounded-xl border border-[#F5D0E6] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[#8E4B5A]">Click-through URL (optional)</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-[#F5D0E6] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[#8E4B5A]">Ad Image *</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="preview" className="mt-3 h-40 w-full rounded-xl object-cover" />
            )}
          </div>
          {message && <p className="mb-3 text-sm text-[#C65D3B]">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#C65D3B] px-6 py-2 text-sm font-semibold text-white hover:bg-[#a84d30] disabled:opacity-50"
          >
            {submitting ? 'Uploading…' : 'Publish Ad'}
          </button>
        </form>

        {/* Ads List */}
        <h2 className="mb-4 text-lg font-semibold text-[#2B2B2B]">All Ads ({ads.length})</h2>
        {fetching ? (
          <p className="text-sm text-[#8E4B5A]">Loading…</p>
        ) : ads.length === 0 ? (
          <p className="text-sm text-[#8E4B5A]">No ads yet.</p>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad._id} className="flex items-center gap-4 rounded-2xl border border-[#F5D0E6] bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt={ad.title} className="h-20 w-28 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-[#2B2B2B]">{ad.title}</p>
                  {ad.linkUrl && <p className="text-xs text-[#8E4B5A] truncate">{ad.linkUrl}</p>}
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ad.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ad.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(ad)}
                    className="rounded-lg border border-[#C65D3B] px-3 py-1 text-xs font-semibold text-[#C65D3B] hover:bg-[#C65D3B] hover:text-white"
                  >
                    {ad.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ad._id)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
