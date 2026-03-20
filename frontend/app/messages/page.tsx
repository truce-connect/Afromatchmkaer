"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchConversation,
  fetchMatches,
  sendMessageRequest,
  type MatchRecord,
  type MessageRecord
} from '@/lib/api';

const SOCKET_ENDPOINT =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api$/, '') : 'http://localhost:5000');

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80';

const formatPreviewTime = (iso?: string) => {
  if (!iso) return 'New';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'New';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return 'Today';
  }
  if (diff < 48 * 60 * 60 * 1000) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const deriveMatchScore = (seed: string, offset = 0) => {
  const total = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.min(99, 80 + ((total + offset * 7) % 18));
};

const formatMessageTimestamp = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const SearchIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#C07A91]">
    <path
      fill="currentColor"
      d="M12.3 11h-.7l-.25-.24A4.5 4.5 0 1 0 11 12.3l.24.25v.7l3.5 3.5a1 1 0 0 0 1.4-1.4ZM5.5 9a3.5 3.5 0 1 1 3.5 3.5A3.5 3.5 0 0 1 5.5 9Z"
    />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#C07A91]">
    <path
      fill="currentColor"
      d="M20 5h-3.2l-1.7-2.3A2 2 0 0 0 14 2h-4a2 2 0 0 0-1.1.3l-1.7 2.2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-8 12.5A4.5 4.5 0 1 1 16.5 13 4.5 4.5 0 0 1 12 17.5Zm0-7A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5Z"
    />
  </svg>
);

const PaperclipIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#C07A91]">
    <path
      fill="currentColor"
      d="M17.5 6.5 8.91 15.09a3 3 0 0 0 4.24 4.24l6.01-6a4 4 0 0 0-5.66-5.66L6.76 14.41a5 5 0 0 0 7.07 7.07l6.01-6a1 1 0 0 1 1.41 1.41l-6 6a7 7 0 0 1-9.9-9.9l6.74-6.74a6 6 0 1 1 8.49 8.49l-6 6a4 4 0 0 1-5.66-5.66l5.3-5.3a1 1 0 1 1 1.42 1.41l-5.3 5.3a2 2 0 1 0 2.83 2.83l6-6a4 4 0 0 0-5.66-5.66Z"
    />
  </svg>
);

function MessagesPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchRecord | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeConversationRef = useRef<string | null>(null);

  const currentUserId = useMemo(() => user?.id || user?._id || '', [user?.id, user?._id]);

  useEffect(() => {
    if (!user) return;
    socketRef.current = io(SOCKET_ENDPOINT, {
      transports: ['websocket'],
      autoConnect: true
    });

    const socket = socketRef.current;

    const handleMessage = (message: MessageRecord) => {
      if (message.conversationId !== activeConversationRef.current) return;
      setMessages((prev) => {
        if (prev.some((existing) => existing._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socket.on('messageCreated', handleMessage);
    socket.on('messageError', (payload) => {
      console.error('Socket error', payload);
      setStatus('Realtime messaging issue. Please retry.');
    });

    return () => {
      socket.off('messageCreated', handleMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await fetchMatches();
        setMatches(data);
        if (data.length > 0) {
          setActiveMatch((current) => current || data[0]);
        }
      } catch (error) {
        console.error('Unable to fetch matches', error);
        setStatus('Unable to load your friends list.');
      } finally {
        setLoadingThreads(false);
      }
    };

    loadMatches();
  }, []);

  useEffect(() => {
    if (!activeMatch) {
      activeConversationRef.current = null;
      setMessages([]);
      return;
    }
    activeConversationRef.current = activeMatch.conversationId;
    setLoadingConversation(true);
    const loadMessages = async () => {
      try {
        const history = await fetchConversation(activeMatch.conversationId);
        setMessages(history);
        socketRef.current?.emit('joinConversation', { conversationId: activeMatch.conversationId });
      } catch (error) {
        console.error('Unable to load conversation', error);
        setStatus('Unable to load conversation.');
      } finally {
        setLoadingConversation(false);
      }
    };

    loadMessages();
  }, [activeMatch]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || !activeMatch || !currentUserId) return;

    const recipientId = activeMatch.profile?._id || activeMatch.profile?.id || activeMatch.participants.find((participant) => participant !== currentUserId);
    if (!recipientId) return;

    setStatus(null);

    try {
      const saved = await sendMessageRequest({
        conversationId: activeMatch.conversationId,
        recipientId,
        body: input.trim()
      });

      setMessages((prev) => (prev.some((msg) => msg._id === saved._id) ? prev : [...prev, saved]));
      socketRef.current?.emit('sendMessage', {
        conversationId: activeMatch.conversationId,
        senderId: currentUserId,
        recipientId,
        body: input.trim()
      });
      setInput('');
    } catch (error) {
      console.error('Unable to send message', error);
      setStatus('Unable to send message. Please retry.');
    }
  };

  const activeProfileLink = activeMatch?.profile?._id || activeMatch?.profile?.id || '';
  const focusProfileId = searchParams.get('focus');

  useEffect(() => {
    if (!focusProfileId || matches.length === 0) return;
    setActiveMatch((current) => {
      const currentProfileId = current?.profile?._id || current?.profile?.id;
      if (currentProfileId === focusProfileId) {
        return current;
      }
      const focused = matches.find((match) => {
        const matchProfileId = match.profile?._id || match.profile?.id;
        return matchProfileId === focusProfileId;
      });
      return focused || current;
    });
  }, [focusProfileId, matches]);

  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-gradient-to-br from-[#FBE4EF] via-[#F9D4E6] to-[#FDEDF3] py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 lg:flex-row lg:px-0">
          <aside className="w-full space-y-6 lg:w-[360px]">
            <div className="rounded-[32px] bg-white/80 p-6 shadow-card backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#C65D3B]">Messages</p>
                  <h2 className="font-display text-2xl text-[#2B2B2B]">Chats</h2>
                </div>
                <span className="rounded-full bg-[#FDEAF3] px-3 py-1 text-xs font-semibold text-[#C65D3B]">{matches.length} friends</span>
              </div>
              <div className="relative mt-5">
                <input
                  type="search"
                  placeholder="Search messages..."
                  className="w-full rounded-full border border-[#F6CADB] bg-white px-4 py-3 text-sm text-[#8E4B5A] placeholder:text-[#C07A91] focus:border-[#C65D3B] focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <SearchIcon />
                </span>
              </div>
              <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {loadingThreads && <p className="text-sm text-[#8E4B5A]">Loading matches…</p>}
                {!loadingThreads && matches.length === 0 && <p className="text-sm text-[#8E4B5A]">No matches yet. Meet people via the discover feed.</p>}
                {matches.map((match, index) => {
                  const isActive = activeMatch?._id === match._id;
                  const profile = match.profile;
                  const avatar = profile?.profileImage || FALLBACK_AVATAR;
                  const score = deriveMatchScore(match._id, index);
                  return (
                    <button
                      key={match._id}
                      onClick={() => setActiveMatch(match)}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                        isActive ? 'border-[#C65D3B] bg-[#FFF4F8]' : 'border-transparent bg-white'
                      }`}
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatar} alt={profile?.name || 'Match avatar'} className="h-full w-full object-cover" />
                        <span className="absolute -right-1 -top-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#C65D3B]">{score}%</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#2B2B2B]">
                            {profile?.name || 'AfroMatch member'}
                            {profile?.age ? <span className="text-xs text-[#8E4B5A]"> · {profile.age}</span> : null}
                          </p>
                          <span className="text-xs text-[#C07A91]">{formatPreviewTime(match.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-[#8E4B5A] line-clamp-1">
                          {profile?.bio || 'Tap to start planning your next hangout.'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[32px] bg-gradient-to-br from-[#F9C0DA] via-[#F6A6C7] to-[#F37BAF] p-6 text-white shadow-card">
              <p className="text-sm uppercase tracking-[0.3em]">Premium</p>
              <h3 className="mt-2 text-2xl font-semibold">Unlock every message</h3>
              <p className="mt-2 text-sm text-white/80">See read receipts, send voice notes, and boost your chats.</p>
              <button type="button" className="mt-4 w-full rounded-full bg-white/90 px-4 py-3 text-sm font-semibold text-[#C65D3B]">
                Upgrade now
              </button>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex h-full flex-col rounded-[40px] bg-white/80 p-6 shadow-card backdrop-blur">
              <div className="rounded-[28px] border border-[#F6CADB] bg-white/80 px-5 py-4">
                {activeMatch ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-full border-4 border-[#FEE4EF]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeMatch.profile?.profileImage || FALLBACK_AVATAR}
                          alt={activeMatch.profile?.name || 'Chat profile'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[#2B2B2B]">
                          {activeMatch.profile?.name || 'Friend'}
                          {activeMatch.profile?.age ? <span className="text-sm text-[#8E4B5A]"> · {activeMatch.profile.age}</span> : null}
                        </p>
                        <p className="text-sm text-[#8E4B5A]">
                          {activeMatch.profile?.country || activeMatch.profile?.gender || 'Across Africa'} ·{' '}
                          {activeMatch.profile?.username ? `@${activeMatch.profile.username}` : 'connected friend'}
                        </p>
                      </div>
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#FDEAF3] px-4 py-1 text-sm font-semibold text-[#C65D3B]">
                        {deriveMatchScore(activeMatch._id)}% Match
                      </span>
                      {activeProfileLink ? (
                        <Link href={`/profile/${activeProfileLink}`} className="rounded-full border border-[#F6CADB] px-4 py-2 text-sm font-semibold text-[#C65D3B]">
                          View profile
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-[#8E4B5A]">Select a friend from the list to start chatting.</div>
                )}
              </div>

              <div className="mt-6 flex-1 rounded-[32px] bg-[#FFE9F2]/80 p-5 shadow-inner">
                {loadingConversation ? (
                  <p className="text-sm text-[#8E4B5A]">Loading conversation…</p>
                ) : !activeMatch ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[#8E4B5A]">
                    <p>Select a conversation to see your messages.</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[#8E4B5A]">
                    <p>No messages yet. Say hi to break the ice!</p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-3 overflow-y-auto pr-2">
                    {messages.map((message) => {
                      const isMine = message.sender === currentUserId;
                      const timestamp = formatMessageTimestamp(message.createdAt);
                      return (
                        <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-[24px] px-4 py-3 text-sm shadow-sm ${
                              isMine
                                ? 'rounded-tr-sm bg-gradient-to-r from-[#F9A3C5] to-[#F47AAE] text-white'
                                : 'rounded-tl-sm bg-white text-[#2B2B2B]'
                            }`}
                          >
                            <p>{message.body}</p>
                            {message.attachments && message.attachments.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {message.attachments.map((attachment) => (
                                  <img key={attachment.url} src={attachment.url} alt="Shared attachment" className="w-full rounded-2xl" />
                                ))}
                              </div>
                            ) : null}
                            {timestamp ? <p className={`mt-2 text-[10px] ${isMine ? 'text-white/70' : 'text-[#C07A91]'}`}>{timestamp}</p> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="mt-6 flex flex-wrap items-center gap-3 rounded-full bg-white/90 px-4 py-3 shadow-card">
                <div className="flex items-center gap-2 text-[#C07A91]">
                  <button type="button" disabled={!activeMatch} className="rounded-full bg-[#FDEAF3] p-2" aria-label="Add media">
                    <CameraIcon />
                  </button>
                  <button type="button" disabled={!activeMatch} className="rounded-full bg-[#FDEAF3] p-2" aria-label="Add attachment">
                    <PaperclipIcon />
                  </button>
                </div>
                <input
                  className="flex-1 border-none bg-transparent text-sm text-[#8E4B5A] placeholder:text-[#C07A91] focus:outline-none"
                  placeholder={activeMatch ? 'Type a message…' : 'Select a friend to start messaging'}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={!activeMatch}
                />
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-[#F598B9] to-[#EC5D94] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!activeMatch || !input.trim()}
                >
                  Send
                </button>
              </form>
              {status && <p className="mt-2 text-sm text-red-500">{status}</p>}
            </div>

            {activeMatch?.profile?.gallery && activeMatch.profile.gallery.length > 0 && (
              <div className="mt-6 rounded-[32px] bg-white/80 p-6 shadow-card">
                <h3 className="font-display text-xl text-[#2B2B2B]">Shared moments</h3>
                <p className="text-sm text-[#8E4B5A]">Saved from {activeMatch.profile.name}&rsquo;s gallery.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {activeMatch.profile.gallery.slice(0, 3).map((image) => (
                    <div key={image} className="aspect-video overflow-hidden rounded-2xl">
                      <img src={image} alt="Friend gallery" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
    </ProtectedRoute>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesPageInner />
    </Suspense>
  );
}
