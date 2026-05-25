import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export default function ScoreCard({ title, value, suffix, hint, Icon, variant = 'light', delay = 0 }) {
  const numeric = typeof value === 'number';
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) =>
    numeric ? (Number.isInteger(value) ? Math.round(latest) : Math.round(latest * 10) / 10) : 0
  );

  useEffect(() => {
    if (!numeric) return;
    const controls = animate(mv, value, { duration: 1.0, ease: 'easeOut', delay });
    return controls.stop;
  }, [value, numeric, delay, mv]);

  // Variants share one rule: value dark for readability, /100 suffix brand
  // orange across all light variants for consistent accent.
  const variants = {
    light: 'bg-white border-cream-400',
    flame: 'bg-flame-900 text-cream-100 border-flame-900',
    cream: 'bg-cream-200 text-flame-900 border-cream-400',
  };
  const titleClr  = variant === 'flame' ? 'text-cream-300' : 'text-flame-500';
  const valueClr  = variant === 'flame' ? 'text-cream-100' : 'text-flame-900';
  const suffixClr = variant === 'flame' ? 'text-cream-300' : 'text-flame-500';
  const hintClr   = variant === 'flame' ? 'text-cream-300' : 'text-cream-700';
  const iconBox   = 'bg-flame-500 text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={`rounded-2xl border shadow-soft p-5 transition-shadow hover:shadow-[0_18px_50px_-18px_rgba(33,37,41,0.25)] ${variants[variant]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[11px] uppercase tracking-[0.16em] font-semibold ${titleClr}`}>{title}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${valueClr}`}>
            {numeric ? <motion.span>{rounded}</motion.span> : value}
            {suffix ? <span className={`ml-1 text-sm font-semibold ${suffixClr}`}>{suffix}</span> : null}
          </p>
          {hint ? <p className={`text-[11px] mt-1 ${hintClr}`}>{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBox}`}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
