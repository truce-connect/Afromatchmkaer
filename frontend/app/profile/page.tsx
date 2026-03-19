"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile, uploadProfileImage, uploadPublicFiles } from '@/lib/api';

interface FormState {
  name: string;
  bio: string;
  country: string;
  address: string;
  gender: string;
  diaspora: boolean;
  interestsText: string;
  profileImage: string;
  gallery: string[];
}

const emptyForm: FormState = {
  name: '',
  bio: '',
  country: '',
  address: '',
  gender: '',
  diaspora: false,
  interestsText: '',
  profileImage: '',
  gallery: []
};

const genderOptions = [
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Non-binary', value: 'nonbinary' },
  { label: 'Other', value: 'other' }
];

export default function ProfilePage() {
  const { user, loading, setUserProfile } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const syncGalleryWithServer = useCallback(
    async (nextGallery: string[], successMessage = 'Gallery updated successfully.') => {
      try {
        const updatedProfile = await updateUserProfile({ gallery: nextGallery });
        setUserProfile(updatedProfile);
        setMessage(successMessage);
      } catch (error) {
        console.error('Gallery sync failed', error);
        setMessage('Unable to update gallery.');
      }
    },
    [setUserProfile]
  );

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        country: user.country || '',
        address: user.address || '',
        gender: user.gender || 'prefer_not_to_say',
        diaspora: Boolean(user.diaspora),
        interestsText: (user.interests || []).join(', '),
        profileImage: user.profileImage || '',
        gallery: user.gallery || []
      });
    }
  }, [user]);

  const interestTags = useMemo(
    () =>
      (user?.interests || [])
        .filter(Boolean)
        .map((item) => item.trim())
        .slice(0, 8),
    [user?.interests]
  );

  const handleFieldChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = field === 'diaspora' ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const uploaded = await uploadProfileImage(file);
      setForm((prev) => ({ ...prev, profileImage: uploaded.url }));
      const updatedProfile = await updateUserProfile({ profileImage: uploaded.url });
      setUserProfile(updatedProfile);
      setMessage('Profile photo updated successfully.');
    } catch (error) {
      console.error('Profile photo upload failed', error);
      setMessage('Unable to upload profile photo.');
    } finally {
      setUploadingAvatar(false);
      input.value = '';
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    setMessage(null);
    try {
      const uploaded = await uploadPublicFiles(files, 'gallery');
      const newUrls = uploaded.files.map((file) => file.url);
      const updatedGallery = [...form.gallery, ...newUrls];
      setForm((prev) => ({ ...prev, gallery: updatedGallery }));
      await syncGalleryWithServer(updatedGallery);
    } catch (error) {
      console.error('Gallery upload failed', error);
      setMessage('Unable to upload gallery images.');
    } finally {
      input.value = '';
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = async (url: string) => {
    const updatedGallery = form.gallery.filter((item) => item !== url);
    setForm((prev) => ({ ...prev, gallery: updatedGallery }));
    await syncGalleryWithServer(updatedGallery, 'Photo removed from gallery.');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const updatedProfile = await updateUserProfile({
        name: form.name,
        bio: form.bio,
        country: form.country,
        address: form.address,
        gender: form.gender,
        diaspora: form.diaspora,
        interests: form.interestsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        profileImage: form.profileImage,
        gallery: form.gallery
      });
      setUserProfile(updatedProfile);
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } catch (error) {
      console.error('Profile update failed', error);
      setMessage('Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-[#F7F4EF] py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-card">
          <p className="font-medium text-[#2B2B2B]">Loading your profile…</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="bg-[#F7F4EF] py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-card">
          <p className="text-[#2B2B2B]">Sign in to view and edit your profile.</p>
        </div>
      </section>
    );
  }

  const profileImage = form.profileImage || user.profileImage || '';

  return (
    <section className="bg-[#F7F4EF] py-12">
      <div className="mx-auto max-w-5xl space-y-8 px-4">
        <div className="rounded-3xl bg-white shadow-card">
          <div className="h-40 rounded-t-3xl bg-gradient-to-r from-[#C65D3B] to-[#F2C94C]" />
          <div className="flex flex-col gap-6 px-8 pb-8 md:flex-row md:items-end">
            <div className="-mt-16 flex items-center gap-4">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#F7F4EF]">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileImage} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-[#C65D3B]">
                    {user.name?.[0] || '?'}
                  </div>
                )}
                {isEditing && (
                  <label
                    htmlFor="profilePhotoInput"
                    className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 text-center text-xs font-semibold text-white"
                  >
                    {uploadingAvatar ? 'Uploading…' : 'Change photo'}
                  </label>
                )}
              </div>
              <input id="profilePhotoInput" type="file" accept="image/*" className="hidden" disabled={!isEditing || uploadingAvatar} onChange={handleProfileImageUpload} />
              <div>
                <h1 className="text-3xl font-display text-[#2B2B2B]">{user.name}</h1>
                <p className="text-sm text-[#2B2B2B]/70">{user.country || 'Country not set'}</p>
                {user.address && <p className="text-sm text-[#2B2B2B]/50">{user.address}</p>}
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="rounded-full border border-[#C65D3B] px-5 py-2 text-sm font-semibold text-[#C65D3B]"
              >
                {isEditing ? 'Close editor' : 'Edit profile'}
              </button>
            </div>
          </div>
          <div className="px-8 pb-8">
            <p className="text-base text-[#2B2B2B]">{user.bio || 'Add a short bio so members can connect over shared experiences.'}</p>
            {interestTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {interestTags.map((interest) => (
                  <span key={interest} className="rounded-full bg-[#F7F4EF] px-3 py-1 text-xs font-semibold text-[#C65D3B]">
                    {interest}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-6 grid gap-4 rounded-2xl bg-[#F7F4EF] p-4 text-sm text-[#2B2B2B] md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#2B2B2B]/60">Friends</p>
                <p className="text-2xl font-semibold">{user.friends?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#2B2B2B]/60">Gallery</p>
                <p className="text-2xl font-semibold">{user.gallery?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#2B2B2B]/60">Interests</p>
                <p className="text-2xl font-semibold">{user.interests?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-8 shadow-card">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-[#2B2B2B]">
                Full name
                <input value={form.name} onChange={handleFieldChange('name')} required className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" />
              </label>
              <label className="text-sm text-[#2B2B2B]">
                Country
                <input value={form.country} onChange={handleFieldChange('country')} className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" />
              </label>
              <label className="text-sm text-[#2B2B2B]">
                City / Address
                <input value={form.address} onChange={handleFieldChange('address')} className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" />
              </label>
              <label className="text-sm text-[#2B2B2B]">
                Gender
                <select value={form.gender} onChange={handleFieldChange('gender')} className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3">
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-sm text-[#2B2B2B]">
              Bio
              <textarea value={form.bio} onChange={handleFieldChange('bio')} className="mt-1 min-h-[120px] w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" placeholder="Tell the community about your background, passions, and what you are looking for." />
            </label>
            <label className="text-sm text-[#2B2B2B]">
              Interests (comma separated)
              <textarea value={form.interestsText} onChange={handleFieldChange('interestsText')} className="mt-1 min-h-[80px] w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" placeholder="Brunch hopping, Afrobeats, pottery" />
            </label>
            <label className="flex items-center gap-3 text-sm text-[#2B2B2B]">
              <input type="checkbox" checked={form.diaspora} onChange={handleFieldChange('diaspora')} className="h-4 w-4 rounded border-[#C65D3B]/40 text-[#C65D3B] focus:ring-[#C65D3B]" />
              I identify as part of the diaspora
            </label>
            <div>
              <p className="text-sm font-semibold text-[#2B2B2B]">Personal gallery</p>
              <p className="text-xs text-[#2B2B2B]/60">Upload up to six recent moments or passions members should see.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {form.gallery.map((url) => (
                  <div key={url} className="relative overflow-hidden rounded-2xl border border-[#C65D3B]/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Gallery item" className="h-40 w-full object-cover" />
                    <button type="button" onClick={() => handleRemoveGalleryImage(url)} className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                      Remove
                    </button>
                  </div>
                ))}
                {form.gallery.length < 6 && (
                  <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C65D3B]/40 text-sm text-[#C65D3B]">
                    {uploadingGallery ? 'Uploading…' : '+ Add photo'}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingGallery} onChange={handleGalleryUpload} />
                  </label>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-[#C65D3B] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-full border border-[#C65D3B]/40 px-6 py-3 text-sm font-semibold text-[#C65D3B]">
                Cancel
              </button>
            </div>
            {message && <p className="text-sm text-[#2B2B2B]">{message}</p>}
          </form>
        )}

        {!isEditing && form.gallery.length > 0 && (
          <div className="rounded-3xl bg-white p-8 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#2B2B2B]/60">Personal gallery</p>
                <h2 className="text-2xl font-display text-[#2B2B2B]">Snapshots of your world</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {form.gallery.map((url) => (
                <div key={url} className="overflow-hidden rounded-2xl border border-[#C65D3B]/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Gallery item" className="h-48 w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {message && !isEditing && <p className="text-center text-sm text-[#2B2B2B]">{message}</p>}
      </div>
    </section>
  );
}
