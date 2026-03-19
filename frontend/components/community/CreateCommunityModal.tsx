'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useCallback, useMemo, useState } from 'react';
import { CommunityRecord, CreateCommunityPayload, createCommunity, uploadPublicFiles } from '@/lib/api';

interface CreateCommunityModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (community: CommunityRecord) => void;
  mode?: 'modal' | 'page';
}

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

const MAX_INTERESTS = 8;

const buildInitialForm = (): (CreateCommunityPayload & { interestInput: string }) => ({
  name: '',
  description: '',
  interests: [],
  coverImage: undefined,
  city: undefined,
  privacy: 'public',
  interestInput: ''
});

export function CreateCommunityModal({ open, onClose, onCreated, mode = 'modal' }: CreateCommunityModalProps) {
  const [formState, setFormState] = useState(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const isModal = mode === 'modal';
  const isVisible = isModal ? open : true;

  const interestChips = useMemo(() => (formState.interests || []).slice(0, MAX_INTERESTS), [formState.interests]);

  const resetForm = useCallback(() => {
    setFormState(buildInitialForm());
    setStatus(null);
  }, []);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const commitInterest = (rawValue?: string) => {
    const value = (rawValue ?? formState.interestInput).trim().toLowerCase();
    if (!value) return;
    setFormState((prev) => {
      const next = new Set(prev.interests);
      if (next.size >= MAX_INTERESTS && !next.has(value)) {
        return prev;
      }
      next.add(value);
      return { ...prev, interests: Array.from(next), interestInput: '' };
    });
  };

  const handleInterestKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitInterest();
    }
  };

  const removeInterest = (interest: string) => {
    setFormState((prev) => ({
      ...prev,
      interests: prev.interests.filter((item) => item !== interest)
    }));
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    setUploading(true);
    setStatus(null);
    try {
      const { files } = await uploadPublicFiles([event.target.files[0]], 'community');
      const uploaded = files[0];
      if (uploaded?.url) {
        setFormState((prev) => ({ ...prev, coverImage: uploaded.url }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload image.';
      setStatus({ type: 'error', text: message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim() || !formState.description.trim()) {
      setStatus({ type: 'error', text: 'Name and description are required.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const payload: CreateCommunityPayload = {
        name: formState.name.trim(),
        description: formState.description.trim(),
        interests: formState.interests,
        coverImage: formState.coverImage,
        city: formState.city?.trim() || undefined,
        privacy: formState.privacy
      };
      const community = await createCommunity(payload);
      setStatus({ type: 'success', text: 'Community created successfully.' });
      onCreated?.(community);
      if (isModal) {
        resetForm();
        onClose();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create community.';
      setStatus({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  const content = (
    <div
      className={
        isModal
          ? 'w-full max-w-2xl rounded-[32px] bg-[#120217] p-8 text-white shadow-2xl'
          : 'w-full rounded-[32px] bg-[#120217] p-8 text-white shadow-[0_40px_140px_rgba(6,0,18,0.6)]'
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">New community</p>
          <h2 className="mt-2 font-display text-3xl">Design a circle that feels like home</h2>
        </div>
        {isModal ? (
          <button type="button" onClick={onClose} className="text-sm font-semibold text-white/70 hover:text-white">
            Close
          </button>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
          Community name
          <input
            name="name"
            value={formState.name}
            onChange={handleFieldChange}
            placeholder="Afro creatives club"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
          Description
          <textarea
            name="description"
            value={formState.description}
            onChange={handleFieldChange}
            rows={4}
            placeholder="What is the flow, and who is it for?"
            className="rounded-3xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
            City (optional)
            <input
              name="city"
              value={formState.city || ''}
              onChange={handleFieldChange}
              placeholder="Accra"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
            Privacy
            <select
              name="privacy"
              value={formState.privacy}
              onChange={handleFieldChange}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-2 text-sm font-semibold text-white/80">
          Interest tags
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2">
            <input
              name="interestInput"
              value={formState.interestInput}
              onChange={(event) => setFormState((prev) => ({ ...prev, interestInput: event.target.value }))}
              onKeyDown={handleInterestKeyDown}
              placeholder="design, wellness, vc"
              className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => commitInterest()}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interestChips.map((interest) => (
              <button
                type="button"
                key={interest}
                onClick={() => removeInterest(interest)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"
              >
                #{interest} ✕
              </button>
            ))}
            {!interestChips.length && <span className="text-xs font-normal text-white/50">Add up to {MAX_INTERESTS} tags.</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm font-semibold text-white/80">
          Cover image
          <input id="community-cover" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          <label
            htmlFor="community-cover"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-white/30 bg-white/5 px-6 py-5 text-white/70"
          >
            <span>{formState.coverImage ? 'Replace image' : 'Upload a cover image'}</span>
            <span className="text-xs text-white/50">JPG or PNG, 1200 × 640px recommended</span>
            {uploading && <span className="text-xs">Uploading…</span>}
          </label>
          {formState.coverImage && (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={formState.coverImage} alt="Community cover preview" className="h-48 w-full object-cover" />
            </div>
          )}
        </div>
        {status ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
              status.type === 'success'
                ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-50'
                : 'border-rose-400/50 bg-rose-400/10 text-rose-100'
            }`}
          >
            {status.text}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#120217] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create community'}
          </button>
          {isModal ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white/80"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      {content}
    </div>
  );
}
