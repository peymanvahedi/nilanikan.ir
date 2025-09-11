'use client';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import type { Season } from './SeasonToggle';

export default function SeasonAlert({ season }: { season: Season }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!season) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 2500); // بعد از ۲.۵ ثانیه محو میشه
    return () => clearTimeout(timer);
  }, [season]);

  const messages: Record<Season, { text: string; emoji: string; color: string }> = {
    autumn: { text: '🍁 الان پاییزه! وقت لباس‌های گرم کودکانه است', emoji: '🧥', color: 'bg-amber-200' },
    winter: { text: '❄️ زمستون شد! لباس‌های برفی کودکانه رو ببین', emoji: '🧤', color: 'bg-blue-200' },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-lg font-bold text-slate-700 ${messages[season].color} z-50`}
        >
          <span className="mr-2">{messages[season].emoji}</span>
          {messages[season].text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
