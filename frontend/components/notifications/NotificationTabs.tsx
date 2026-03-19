'use client';

import { motion } from 'framer-motion';

type FilterValue = 'all' | 'unread' | 'messages' | 'community';

interface NotificationTabsProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

const tabs: { key: FilterValue; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'messages', label: 'Messages' },
  { key: 'community', label: 'Community' }
];

export function NotificationTabs({ value, onChange }: NotificationTabsProps) {
  return (
    <div className="relative flex w-full flex-wrap gap-2 rounded-2xl bg-white/5 p-1 text-sm font-semibold text-white/70">
      {tabs.map((tab) => {
        const isActive = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative flex-1 rounded-2xl px-4 py-2 transition ${isActive ? 'text-[#0E1A2F]' : 'text-white/70 hover:text-white'}`}
          >
            {isActive ? (
              <motion.span
                layoutId="notification-tab"
                className="absolute inset-0 rounded-2xl bg-white"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
