"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerRequest, uploadProfileImage } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function JoinPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    address: '',
    country: '',
    hobbies: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const parsedHobbies = useMemo(
    () =>
      form.hobbies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [form.hobbies]
  );

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImageFile]);

  const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  const passwordIsValid = passwordPattern.test(form.password);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!profileImageFile) {
        setMessage('Add a profile photo to continue.');
        return;
      }

      let uploadedPhotoUrl: string | undefined;
      try {
        const uploaded = await uploadProfileImage(profileImageFile);
        uploadedPhotoUrl = uploaded.url;
      } catch (error) {
        console.error('Profile upload failed', error);
        setMessage('Unable to upload your profile photo. Try again.');
        return;
      }

      const response = await registerRequest({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        address: form.address,
        country: form.country,
        interests: parsedHobbies,
        profileImage: uploadedPhotoUrl,
        gallery: uploadedPhotoUrl ? [uploadedPhotoUrl] : []
      });
      setMessage(response.message || 'Account created successfully.');
      if (response.accessToken && response.user) {
        await setSession(response);
        router.push('/dashboard');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message;
      setMessage(errorMessage || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmitForm =
    !!form.name &&
    !!form.username &&
    !!form.email &&
    !!form.password &&
    !!form.country &&
    parsedHobbies.length > 0 &&
    passwordIsValid &&
    Boolean(profileImagePreview);

  return (
    <section className="bg-[#F7F4EF]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-card">
        <motion.form onSubmit={handleRegister} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h1 className="font-display text-3xl text-[#2B2B2B]">Join the AfroMatchmaker.com circles</h1>
            <p className="mt-2 text-sm text-[#2B2B2B]/70">Curated onboarding ensures you meet friends who get you.</p>
          </div>
          <label className="text-sm text-[#2B2B2B]">
            Username
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" placeholder="@yara" />
          </label>
          <label className="text-sm text-[#2B2B2B]">
            Full name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" />
          </label>
          <label className="text-sm text-[#2B2B2B]">
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" />
          </label>
          <label className="text-sm text-[#2B2B2B]">
            Profile photo
            <input
              type="file"
              accept="image/*"
              required
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setProfileImageFile(file);
              }}
              className="mt-1 w-full rounded-2xl border border-dashed border-[#C65D3B]/40 px-4 py-3 text-sm"
            />
            <span className="mt-1 block text-xs text-[#2B2B2B]/70">Upload a clear face photo (max 5MB) to help members recognize you.</span>
          </label>
          {profileImagePreview && (
            <div className="md:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-[#C65D3B]/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileImagePreview} alt="Profile preview" className="h-48 w-full object-cover" />
              </div>
            </div>
          )}
          <label className="text-sm text-[#2B2B2B]">
            Country
            <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} required className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" placeholder="Nigeria" />
          </label>
          <label className="text-sm text-[#2B2B2B] md:col-span-2">
            Password
            <div className="mt-1 flex items-center rounded-2xl border border-[#C65D3B]/20 px-4">
              <input
                type={passwordVisible ? 'text' : 'password'}
                minLength={8}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                className="w-full border-none bg-transparent py-3 outline-none"
              />
              <button type="button" onClick={() => setPasswordVisible((prev) => !prev)} className="text-sm font-semibold text-[#C65D3B]">
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            <span className={`mt-1 block text-xs ${passwordIsValid ? 'text-emerald-600' : 'text-red-600'}`}>
              Use 8+ characters with at least one uppercase letter, one number, and one special symbol.
            </span>
          </label>
          <label className="text-sm text-[#2B2B2B] md:col-span-2">
            Address / City (optional)
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" placeholder="Accra, East Legon" />
          </label>
          <label className="text-sm text-[#2B2B2B] md:col-span-2">
            Hobbies & interests (comma separated)
            <textarea value={form.hobbies} onChange={(event) => setForm({ ...form, hobbies: event.target.value })} required className="mt-1 min-h-[90px] w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" placeholder="Brunch hopping, Afrobeats, pottery" />
          </label>
          <button type="submit" disabled={loading || !canSubmitForm} className="md:col-span-2 rounded-full bg-[#C65D3B] px-6 py-3 font-semibold text-white">
            {loading ? 'Submitting...' : 'Create Account'}
          </button>
        </motion.form>
        {message && <p className="text-sm text-[#2B2B2B]">{message}</p>}
        <p className="text-center text-sm text-[#2B2B2B]/70">
          Already a member? <Link href="/login" className="text-[#C65D3B]">Login</Link>
        </p>
      </div>
    </section>
  );
}
