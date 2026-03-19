'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import {
  changePasswordRequest,
  deleteAccountRequest,
  updateUserProfile,
  uploadProfileImage,
  uploadPublicFiles
} from '@/lib/api';

type StatusMessage = { type: 'success' | 'error'; message: string };

type NotificationPreferencesState = {
  friendRequests: boolean;
  messages: boolean;
  communityActivity: boolean;
  emailUpdates: boolean;
};

type PrivacyState = {
  profileVisibility: 'everyone' | 'matches' | 'private';
  friendRequests: 'everyone' | 'friends_of_friends' | 'no_one';
  messages: 'everyone' | 'matches' | 'friends_only';
};

type SectionId = 'profile' | 'account' | 'privacy' | 'notifications' | 'security' | 'danger';

type ProfileFormState = {
  bio: string;
  interests: string;
  country: string;
  city: string;
  profileImage: string;
  coverPhoto: string;
};

type AccountFormState = {
  displayName: string;
  username: string;
  email: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const sections: Array<{ id: SectionId; label: string; description: string }> = [
  { id: 'profile', label: 'Profile', description: 'Photos, bio, interests' },
  { id: 'account', label: 'Account', description: 'Identity & handles' },
  { id: 'privacy', label: 'Privacy', description: 'Visibility controls' },
  { id: 'notifications', label: 'Notifications', description: 'Alerts & reminders' },
  { id: 'security', label: 'Security', description: 'Password & safety' },
  { id: 'danger', label: 'Danger Zone', description: 'Delete your account' }
];

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=60&sat=-20&exp=-15';

const inputClasses =
  'mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        checked ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 bg-white/5'
      }`}
    >
      <span className="text-sm text-white">{label}</span>
      <span
        className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
          checked ? 'bg-emerald-400' : 'bg-white/20'
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5 text-emerald-600' : 'translate-x-0 text-white/60'}`}
        />
      </span>
    </button>
  );
}

function StatusBanner({ status }: { status: StatusMessage | null }) {
  if (!status) return null;
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        status.type === 'success' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-rose-500/10 text-rose-200'
      }`}
    >
      {status.message}
    </div>
  );
}

function SettingsScreen() {
  const router = useRouter();
  const { user, setUserProfile, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>('profile');

  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    bio: '',
    interests: '',
    country: '',
    city: '',
    profileImage: '',
    coverPhoto: ''
  });
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    displayName: '',
    username: '',
    email: ''
  });
  const [notificationsForm, setNotificationsForm] = useState<NotificationPreferencesState>({
    friendRequests: true,
    messages: true,
    communityActivity: true,
    emailUpdates: true
  });
  const [privacyForm, setPrivacyForm] = useState<PrivacyState>({
    profileVisibility: 'matches',
    friendRequests: 'everyone',
    messages: 'matches'
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileStatus, setProfileStatus] = useState<StatusMessage | null>(null);
  const [accountStatus, setAccountStatus] = useState<StatusMessage | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<StatusMessage | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<StatusMessage | null>(null);
  const [securityStatus, setSecurityStatus] = useState<StatusMessage | null>(null);
  const [dangerStatus, setDangerStatus] = useState<StatusMessage | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      bio: user.bio || '',
      interests: (user.interests || []).join(', '),
      country: user.country || '',
      city: user.address || '',
      profileImage: user.profileImage || '',
      coverPhoto: user.coverPhoto || ''
    });
    setAccountForm({
      displayName: user.name || '',
      username: user.username || '',
      email: user.email || ''
    });
    setNotificationsForm({
      friendRequests: user.notificationPreferences?.friendRequests ?? true,
      messages: user.notificationPreferences?.messages ?? true,
      communityActivity: user.notificationPreferences?.communityActivity ?? true,
      emailUpdates: user.notificationPreferences?.emailUpdates ?? true
    });
    setPrivacyForm({
      profileVisibility: (user.privacySettings?.profileVisibility as PrivacyState['profileVisibility']) || 'matches',
      friendRequests: (user.privacySettings?.friendRequests as PrivacyState['friendRequests']) || 'everyone',
      messages: (user.privacySettings?.messages as PrivacyState['messages']) || 'matches'
    });
  }, [user]);

  const handleProfileInput = (field: keyof ProfileFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setProfileForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleAccountInput = (field: keyof AccountFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setAccountForm((prev) => ({ ...prev, [field]: value }));
    };

  const handlePrivacyInput = <K extends keyof PrivacyState>(field: K) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as PrivacyState[K];
      setPrivacyForm((prev) => ({ ...prev, [field]: value }));
    };

  const handlePasswordInput = (field: keyof PasswordFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileStatus(null);
    try {
      const interests = profileForm.interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const updated = await updateUserProfile({
        bio: profileForm.bio,
        interests,
        country: profileForm.country,
        address: profileForm.city,
        profileImage: profileForm.profileImage,
        coverPhoto: profileForm.coverPhoto
      });
      setUserProfile(updated);
      setProfileStatus({ type: 'success', message: 'Profile settings saved.' });
    } catch (error) {
      console.error('Profile save failed', error);
      setProfileStatus({ type: 'error', message: 'Unable to save profile settings.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAccountSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setAccountSaving(true);
    setAccountStatus(null);
    try {
      const updated = await updateUserProfile({
        name: accountForm.displayName.trim(),
        username: accountForm.username.trim().toLowerCase(),
        email: accountForm.email.trim().toLowerCase()
      });
      setUserProfile(updated);
      setAccountStatus({ type: 'success', message: 'Account details updated.' });
    } catch (error) {
      console.error('Account update failed', error);
      setAccountStatus({ type: 'error', message: 'Unable to update account details.' });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferencesState) => {
    const nextValue = !notificationsForm[key];
    const nextState = { ...notificationsForm, [key]: nextValue };
    setNotificationsForm(nextState);
    setNotificationStatus(null);
    setNotificationsSaving(true);
    try {
      const updated = await updateUserProfile({ notificationPreferences: nextState });
      setUserProfile(updated);
      setNotificationStatus({ type: 'success', message: 'Notification preferences updated.' });
    } catch (error) {
      console.error('Notification update failed', error);
      setNotificationsForm((prev) => ({ ...prev, [key]: !nextValue }));
      setNotificationStatus({ type: 'error', message: 'Unable to update notifications.' });
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handlePrivacySave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrivacySaving(true);
    setPrivacyStatus(null);
    try {
      const updated = await updateUserProfile({ privacySettings: privacyForm });
      setUserProfile(updated);
      setPrivacyStatus({ type: 'success', message: 'Privacy preferences saved.' });
    } catch (error) {
      console.error('Privacy update failed', error);
      setPrivacyStatus({ type: 'error', message: 'Unable to save privacy settings.' });
    } finally {
      setPrivacySaving(false);
    }
  };

  const handlePasswordSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setSecurityStatus({ type: 'error', message: 'Please complete all password fields.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSecurityStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    setSecuritySaving(true);
    setSecurityStatus(null);
    try {
      await changePasswordRequest({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setSecurityStatus({ type: 'success', message: 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change failed', error);
      setSecurityStatus({ type: 'error', message: 'Unable to update password.' });
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleProfilePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setProfileStatus(null);
    try {
      const uploaded = await uploadProfileImage(file);
      const updated = await updateUserProfile({ profileImage: uploaded.url });
      setUserProfile(updated);
      setProfileForm((prev) => ({ ...prev, profileImage: uploaded.url }));
      setProfileStatus({ type: 'success', message: 'Profile photo updated.' });
    } catch (error) {
      console.error('Profile photo upload failed', error);
      setProfileStatus({ type: 'error', message: 'Unable to upload profile photo.' });
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleCoverPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setProfileStatus(null);
    try {
      const uploaded = await uploadPublicFiles([file], 'cover');
      const url = uploaded.files?.[0]?.url;
      if (!url) {
        throw new Error('Upload failed');
      }
      const updated = await updateUserProfile({ coverPhoto: url });
      setUserProfile(updated);
      setProfileForm((prev) => ({ ...prev, coverPhoto: url }));
      setProfileStatus({ type: 'success', message: 'Cover photo updated.' });
    } catch (error) {
      console.error('Cover photo upload failed', error);
      setProfileStatus({ type: 'error', message: 'Unable to upload cover photo.' });
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your AfroMatchmaker account. Continue?');
    if (!confirmed) return;
    setDeletingAccount(true);
    setDangerStatus(null);
    try {
      await deleteAccountRequest();
      logout();
      router.replace('/');
    } catch (error) {
      console.error('Account deletion failed', error);
      setDangerStatus({ type: 'error', message: 'Unable to delete account. Please try again.' });
    } finally {
      setDeletingAccount(false);
    }
  };

  const profileSection = (
    <motion.form layout onSubmit={handleProfileSave} className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-white/10">
        <div className="relative h-48 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profileForm.coverPhoto || FALLBACK_COVER} alt="Cover" className="h-full w-full object-cover" />
          <label className="absolute right-4 top-4 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold" htmlFor="coverUpload">
            {uploadingCover ? 'Uploading…' : 'Change cover'}
          </label>
          <input id="coverUpload" type="file" accept="image/*" className="hidden" disabled={uploadingCover} onChange={handleCoverPhotoUpload} />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-16 flex flex-wrap items-center gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-[#05020C]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profileForm.profileImage || FALLBACK_COVER} alt="Profile" className="h-full w-full object-cover" />
              <label className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-semibold" htmlFor="avatarUpload">
                {uploadingAvatar ? 'Uploading…' : 'Change photo'}
              </label>
              <input id="avatarUpload" type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={handleProfilePhotoUpload} />
            </div>
            <div>
              <p className="text-sm text-white/70">Profile completeness</p>
              <div className="mt-1 h-2 w-40 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/80">
          Country
          <input value={profileForm.country} onChange={handleProfileInput('country')} className={inputClasses} placeholder="Ghana" />
        </label>
        <label className="text-sm text-white/80">
          City / Neighborhood
          <input value={profileForm.city} onChange={handleProfileInput('city')} className={inputClasses} placeholder="Accra" />
        </label>
      </div>
      <label className="text-sm text-white/80">
        Bio
        <textarea value={profileForm.bio} onChange={handleProfileInput('bio')} className={`${inputClasses} min-h-[140px]`} placeholder="Share your story, passions, and what you are creating." />
      </label>
      <label className="text-sm text-white/80">
        Interests (comma separated)
        <textarea value={profileForm.interests} onChange={handleProfileInput('interests')} className={`${inputClasses} min-h-[120px]`} placeholder="Diaspora dinners, Afrobeats, wellness" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={profileSaving} className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217] disabled:opacity-60">
          {profileSaving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
      <StatusBanner status={profileStatus} />
    </motion.form>
  );

  const accountSection = (
    <motion.form layout onSubmit={handleAccountSave} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/80">
          Display name
          <input value={accountForm.displayName} onChange={handleAccountInput('displayName')} className={inputClasses} placeholder="Afro Creative" />
        </label>
        <label className="text-sm text-white/80">
          Username
          <input value={accountForm.username} onChange={handleAccountInput('username')} className={inputClasses} placeholder="afrocreative" />
        </label>
      </div>
      <label className="text-sm text-white/80">
        Email address
        <input type="email" value={accountForm.email} onChange={handleAccountInput('email')} className={inputClasses} placeholder="you@example.com" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={accountSaving} className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217] disabled:opacity-60">
          {accountSaving ? 'Saving…' : 'Save account'}
        </button>
      </div>
      <StatusBanner status={accountStatus} />
    </motion.form>
  );

  const notificationSection = (
    <motion.div layout className="space-y-4">
      <p className="text-sm text-white/70">Choose how you would like to be notified about activity.</p>
      <div className="space-y-3">
        <Toggle label="Friend requests" checked={notificationsForm.friendRequests} onChange={() => handleNotificationToggle('friendRequests')} />
        <Toggle label="Messages" checked={notificationsForm.messages} onChange={() => handleNotificationToggle('messages')} />
        <Toggle label="Community activity" checked={notificationsForm.communityActivity} onChange={() => handleNotificationToggle('communityActivity')} />
        <Toggle label="Email digests" checked={notificationsForm.emailUpdates} onChange={() => handleNotificationToggle('emailUpdates')} />
      </div>
      <p className="text-xs text-white/50">Changes save instantly for consistent behavior across devices.</p>
      {notificationsSaving ? <p className="text-xs text-white/70">Saving preferences…</p> : null}
      <StatusBanner status={notificationStatus} />
    </motion.div>
  );

  const privacySection = (
    <motion.form layout onSubmit={handlePrivacySave} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/80">
          Profile visibility
          <select value={privacyForm.profileVisibility} onChange={handlePrivacyInput('profileVisibility')} className={inputClasses}>
            <option value="everyone">Everyone</option>
            <option value="matches">Matches only</option>
            <option value="private">Only me</option>
          </select>
        </label>
        <label className="text-sm text-white/80">
          Who can send friend requests?
          <select value={privacyForm.friendRequests} onChange={handlePrivacyInput('friendRequests')} className={inputClasses}>
            <option value="everyone">Everyone</option>
            <option value="friends_of_friends">Friends of friends</option>
            <option value="no_one">No one</option>
          </select>
        </label>
        <label className="text-sm text-white/80">
          Who can message you?
          <select value={privacyForm.messages} onChange={handlePrivacyInput('messages')} className={inputClasses}>
            <option value="everyone">Everyone</option>
            <option value="matches">Matches only</option>
            <option value="friends_only">Friends only</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={privacySaving} className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217] disabled:opacity-60">
          {privacySaving ? 'Saving…' : 'Save privacy settings'}
        </button>
      </div>
      <StatusBanner status={privacyStatus} />
    </motion.form>
  );

  const securitySection = (
    <motion.form layout onSubmit={handlePasswordSave} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/80">
          Current password
          <input type="password" value={passwordForm.currentPassword} onChange={handlePasswordInput('currentPassword')} className={inputClasses} />
        </label>
        <span className="text-xs text-white/60">Need a reset? Visit the forgot password flow from the login page.</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/80">
          New password
          <input type="password" value={passwordForm.newPassword} onChange={handlePasswordInput('newPassword')} className={inputClasses} />
        </label>
        <label className="text-sm text-white/80">
          Confirm new password
          <input type="password" value={passwordForm.confirmPassword} onChange={handlePasswordInput('confirmPassword')} className={inputClasses} />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={securitySaving} className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217] disabled:opacity-60">
          {securitySaving ? 'Updating…' : 'Update password'}
        </button>
      </div>
      <StatusBanner status={securityStatus} />
    </motion.form>
  );

  const dangerSection = (
    <motion.div layout className="space-y-4 rounded-[32px] border border-rose-500/30 bg-rose-500/5 p-6">
      <h3 className="text-xl font-display text-white">Delete account</h3>
      <p className="text-sm text-white/70">
        Removing your account deletes matches, conversations, and community memberships. This action cannot be undone.
      </p>
      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={deletingAccount}
        className="rounded-full bg-rose-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {deletingAccount ? 'Deleting…' : 'Delete account'}
      </button>
      <StatusBanner status={dangerStatus} />
    </motion.div>
  );

  const sectionContent: Record<SectionId, JSX.Element> = {
    profile: profileSection,
    account: accountSection,
    privacy: privacySection,
    notifications: notificationSection,
    security: securitySection,
    danger: dangerSection
  };

  const activeContent = sectionContent[activeSection];

  if (!user) {
    return (
      <section className="min-h-screen bg-[#05020C] py-20 text-center text-white/70">
        <p>Loading your settings…</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#05020C] py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] bg-white/5 p-8 ring-1 ring-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Control center</p>
          <h1 className="mt-3 font-display text-4xl">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Manage how your profile shows up, how the community reaches you, and keep your account secure.
          </p>
        </motion.header>
        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          <aside className="rounded-[32px] border border-white/10 bg-white/5 p-4">
            <nav className="flex flex-col gap-2">
              {sections.map((section) => {
                const isActive = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`rounded-2xl px-4 py-3 text-left transition ${
                      isActive ? 'bg-white text-[#120217]' : 'bg-transparent text-white hover:bg-white/10'
                    }`}
                  >
                    <p className="text-sm font-semibold">{section.label}</p>
                    <p className="text-xs text-white/60">{section.description}</p>
                  </button>
                );
              })}
            </nav>
          </aside>
          <motion.section key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            {activeContent}
          </motion.section>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}
