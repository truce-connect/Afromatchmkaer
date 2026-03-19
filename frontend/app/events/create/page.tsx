'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { createEvent, type CreateEventPayload, uploadPublicFiles } from '@/lib/api';

interface EventFormState {
  title: string;
  description: string;
  summary: string;
  location: string;
  city: string;
  country: string;
  timezone: string;
  isVirtual: boolean;
  startsAt: string;
  endsAt: string;
  coverImage: string;
  capacity: string;
  hostType: 'user' | 'community' | 'partner';
  communityId: string;
  shareUrl: string;
  source: string;
}

type StatusState = { type: 'success' | 'error'; text: string } | null;

const HOST_TYPE_COPY: Record<EventFormState['hostType'], string> = {
  user: 'Personal drop',
  community: 'Community chapter',
  partner: 'Brand / partner'
};

const INITIAL_FORM: EventFormState = {
  title: '',
  description: '',
  summary: '',
  location: '',
  city: '',
  country: '',
  timezone: '',
  isVirtual: false,
  startsAt: '',
  endsAt: '',
  coverImage: '',
  capacity: '',
  hostType: 'user',
  communityId: '',
  shareUrl: '',
  source: ''
};

const FALLBACK_PREVIEW =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80&sat=-18';

const MAX_TAGS = 12;

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formState, setFormState] = useState<EventFormState>(INITIAL_FORM);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const userCountry = user?.country;
    if (!userCountry) {
      return;
    }
    setFormState((prev) => {
      if (prev.country) {
        return prev;
      }
      return { ...prev, country: userCountry };
    });
  }, [user?.country]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const upcomingLabel = useMemo(() => {
    if (!formState.startsAt) return 'Pick a date to preview';
    const start = new Date(formState.startsAt);
    if (Number.isNaN(start.getTime())) return 'Dates to be announced';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(start);
  }, [formState.startsAt]);

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const isCheckbox = 'type' in event.target && event.target.type === 'checkbox';
    const nextValue = isCheckbox && 'checked' in event.target ? event.target.checked : value;
    setFormState((prev) => ({
      ...prev,
      [name]: nextValue
    }));
  };

  const commitTags = () => {
    if (!tagInput.trim()) return;
    const freshTags = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!freshTags.length) return;
    setTags((prev) => {
      const merged = Array.from(new Set([...prev, ...freshTags]));
      return merged.slice(0, MAX_TAGS);
    });
    setTagInput('');
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitTags();
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    setIsUploading(true);
    setStatus(null);
    try {
      const { files } = await uploadPublicFiles([file], 'event');
      const uploaded = files[0];
      if (uploaded?.url) {
        setFormState((prev) => ({ ...prev, coverImage: uploaded.url }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload image.';
      setStatus({ type: 'error', text: message });
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    if (!formState.title.trim()) {
      setStatus({ type: 'error', text: 'Please add an event title.' });
      return false;
    }
    if (!formState.description.trim()) {
      setStatus({ type: 'error', text: 'Describe your gathering so people know the vibe.' });
      return false;
    }
    if (!formState.startsAt) {
      setStatus({ type: 'error', text: 'Select when the event starts.' });
      return false;
    }
    if (formState.hostType === 'community' && !formState.communityId.trim()) {
      setStatus({ type: 'error', text: 'Choose which community is hosting this event.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CreateEventPayload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        summary: formState.summary?.trim() || undefined,
        location: formState.location?.trim() || undefined,
        city: formState.city?.trim() || undefined,
        country: formState.country?.trim() || undefined,
        timezone: formState.timezone?.trim() || undefined,
        isVirtual: formState.isVirtual,
        startsAt: new Date(formState.startsAt).toISOString(),
        endsAt: formState.endsAt ? new Date(formState.endsAt).toISOString() : undefined,
        coverImage: formState.coverImage || undefined,
        tags: tags.length ? tags : undefined,
        capacity: formState.capacity ? Number(formState.capacity) : undefined,
        hostType: formState.hostType,
        communityId: formState.hostType === 'community' ? formState.communityId.trim() || undefined : undefined,
        shareUrl: formState.shareUrl?.trim() || undefined,
        source: formState.source?.trim() || undefined
      };

      await createEvent(payload);
      setStatus({ type: 'success', text: 'Event published. Redirecting to discovery…' });
      redirectTimerRef.current = setTimeout(() => {
        router.push('/events');
      }, 900);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || 'Unable to save event.'
          : error instanceof Error
          ? error.message
          : 'Unable to save event.';
      setStatus({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewTags = tags.length ? tags : ['slow-dinners', 'listening-room', 'heritage'];
  const previewCover = formState.coverImage || FALLBACK_PREVIEW;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#05020C] pb-16 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <section className="rounded-[40px] bg-gradient-to-br from-[#1B0B2A] via-[#3B1244] to-[#5A1751] p-10 shadow-[0_40px_140px_rgba(6,0,18,0.6)]">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">Host an experience</p>
            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-display text-4xl leading-tight md:text-5xl">Upload an event that feels like home</h1>
                <p className="mt-4 max-w-2xl text-base text-white/80">
                  Share supper clubs, walking salons, accountability labs, or any gathering you want the diaspora to
                  experience IRL. We sync your drop to the discovery hub once it’s reviewed.
                </p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-sm text-white/80">
                <p className="font-semibold">You’re hosting as</p>
                <p className="text-white">{user?.name || 'Community member'}</p>
                <p className="text-xs text-white/60">{HOST_TYPE_COPY[formState.hostType]}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/70">
              <span className="rounded-full bg-white/10 px-4 py-2">
                Auto-matches to {user?.interests?.slice(0, 3).join(', ') || 'your audience'}
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2">
                Sends RSVP confirmations + share link automatically
              </span>
            </div>
            <div className="mt-6 text-sm text-white/70">
              Need help with production? Email <a href="mailto:studio@afromatchmaker.com" className="text-white underline">studio@afromatchmaker.com</a> for concierge support.
            </div>
          </section>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.7fr,1fr]">
            <form onSubmit={handleSubmit} className="space-y-8 rounded-[32px] bg-white/5 p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Event title
                  <input
                    type="text"
                    name="title"
                    value={formState.title}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40"
                    placeholder="Diaspora listening salon"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Host type
                  <select
                    name="hostType"
                    value={formState.hostType}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                  >
                    <option value="user">Personal drop</option>
                    <option value="community">Community chapter</option>
                    <option value="partner">Partner / brand</option>
                  </select>
                </label>
              </div>

              {formState.hostType === 'community' && (
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Community ID
                  <input
                    type="text"
                    name="communityId"
                    value={formState.communityId}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="Paste the community ID"
                  />
                  <span className="text-xs font-normal text-white/60">
                    Paste the ID of the community you lead. If you need help retrieving it, ping studio support.
                  </span>
                </label>
              )}

              <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                Description
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleFieldChange}
                  rows={5}
                  placeholder="Set the tone, flow, dress code, playlists, facilitators..."
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                Short teaser (optional)
                <textarea
                  name="summary"
                  value={formState.summary}
                  onChange={handleFieldChange}
                  rows={3}
                  placeholder="One or two sentences that appear in cards and share links"
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40"
                />
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Starts at
                  <input
                    type="datetime-local"
                    name="startsAt"
                    value={formState.startsAt}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Ends at
                  <input
                    type="datetime-local"
                    name="endsAt"
                    value={formState.endsAt}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Location or venue
                  <input
                    type="text"
                    name="location"
                    value={formState.location}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="The Florist Studio, Lagos"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  City
                  <input
                    type="text"
                    name="city"
                    value={formState.city}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="Accra"
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Country
                  <input
                    type="text"
                    name="country"
                    value={formState.country}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="Ghana"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Timezone
                  <input
                    type="text"
                    name="timezone"
                    value={formState.timezone}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="GMT+1"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold text-white/80">
                  <input
                    type="checkbox"
                    name="isVirtual"
                    checked={formState.isVirtual}
                    onChange={handleFieldChange}
                    className="h-5 w-5 rounded border-white/40 bg-transparent"
                  />
                  This is a virtual event
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Capacity (optional)
                  <input
                    type="number"
                    name="capacity"
                    value={formState.capacity}
                    onChange={handleFieldChange}
                    min="1"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="40"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Share link override
                  <input
                    type="text"
                    name="shareUrl"
                    value={formState.shareUrl}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Source / partner label
                  <input
                    type="text"
                    name="source"
                    value={formState.source}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                    placeholder="AfroMatchmaker Studio"
                  />
                </label>
                <div className="flex flex-col gap-2 text-sm font-semibold text-white/80">
                  Tags (press Enter)
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="supper-club, wellness, fintech"
                      className="flex-1 bg-transparent text-base text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={commitTags}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"
                      >
                        #{tag} ✕
                      </button>
                    ))}
                    {!tags.length && <span className="text-xs font-normal text-white/50">Add up to {MAX_TAGS} tags.</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-sm font-semibold text-white/80">
                <span>Cover image</span>
                <input id="event-cover" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <label
                  htmlFor="event-cover"
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-dashed border-white/30 bg-white/5 p-6 text-center"
                >
                  <span className="text-base">Drag in a banner or click to upload</span>
                  <span className="text-xs text-white/60">Recommended 1200 × 640px JPG/PNG (max 3 MB)</span>
                  {isUploading && <span className="text-xs text-white/70">Uploading…</span>}
                </label>
              </div>

              {status && (
                <div
                  className={`rounded-3xl border px-4 py-3 text-sm font-semibold ${
                    status.type === 'success'
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                      : 'border-rose-400/40 bg-rose-400/10 text-rose-100'
                  }`}
                >
                  {status.text}
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#120217] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Publishing…' : 'Publish event'}
                </button>
                <Link
                  href="/events"
                  className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white/80"
                >
                  Cancel
                </Link>
              </div>
            </form>

            <aside className="rounded-[32px] bg-gradient-to-b from-[#15081F] to-[#240C2F] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Live preview</p>
              <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-4">
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={previewCover}
                    alt="Event preview"
                    width={520}
                    height={260}
                    sizes="(min-width: 1024px) 340px, 100vw"
                    className="h-48 w-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-white/70">{upcomingLabel}</p>
                  <h2 className="text-xl font-semibold">{formState.title || 'Name your gathering'}</h2>
                  <p className="text-sm text-white/60">{formState.location || formState.city || formState.country || 'City / virtual'}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-white/80">
                  <p className="font-semibold">Hosted by {user?.name || 'You'}</p>
                  <p className="text-white/60">{HOST_TYPE_COPY[formState.hostType]}</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <p className="font-semibold text-white">Need inspiration?</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Upload concept mood boards via the cover image control.</li>
                  <li>Use tags for music genres, cuisines, micro-communities.</li>
                  <li>Set capacity to auto-manage RSVPs once spots fill.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
