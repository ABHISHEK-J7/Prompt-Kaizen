import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trophy, Award, Medal, Inbox, Clock, BarChart3, Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance.js';

function formatDuration(ms) {
  if (!ms || ms < 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const hr = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (hr > 0) return `${hr}h ${String(min).padStart(2, '0')}m`;
  return `${min}m ${String(sec).padStart(2, '0')}s`;
}

function rankIcon(rank) {
  if (rank === 1) return Trophy;
  if (rank === 2) return Award;
  if (rank === 3) return Medal;
  return null;
}

export default function ContestLeaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contests/leaderboard')
      .then((res) => setRows(res.data.leaderboard || []))
      .catch((e) => toast.error(e?.response?.data?.message || 'Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  const me = rows.find((r) => r.isMe);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <Link to="/contests" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-flame-400 hover:text-flame-900 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to contests
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-flame-900">Leaderboard</h1>
          <p className="text-flame-500 text-sm">
            Ranked by average accuracy. Ties broken by faster submission time.
          </p>
        </div>
        {me ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-cream-100 border border-cream-200 text-flame-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Your rank · #{me.rank}
          </span>
        ) : null}
      </motion.div>

      <Podium rows={rows} loading={loading} />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-cream-50/60" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-cream-100 text-flame-900 flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="mt-3 font-semibold text-flame-900">No submissions yet</p>
            <p className="text-sm text-flame-500 mt-1">
              Be the first to submit a contest to claim the top spot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-flame-400 border-b border-flame-50 bg-cream-50/40">
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Rank</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Participant</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Avg score</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Avg time</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Contests</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Best</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const Icon = rankIcon(r.rank);
                  return (
                    <motion.tr
                      key={r.userId}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className={`border-b border-flame-50/60 transition ${
                        r.isMe
                          ? 'bg-cream-100/70 hover:bg-cream-200/70'
                          : r.rank <= 3
                            ? 'bg-cream-50/40 hover:bg-cream-50/80'
                            : 'hover:bg-cream-50/40'
                      }`}
                    >
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${
                          r.rank <= 3 ? 'text-flame-900' : 'text-flame-700'
                        }`}>
                          {Icon ? <Icon className="w-4 h-4 text-flame-900" strokeWidth={2.4} /> : null}
                          #{r.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                            r.isMe ? 'bg-flame-900 text-cream-300' : 'bg-cream-300 text-flame-900'
                          }`}>
                            {r.name?.[0] || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-flame-900 inline-flex items-center gap-1.5">
                              {r.name}
                              {r.isMe ? (
                                <span className="badge bg-flame-900 text-cream-300 text-[9px]">You</span>
                              ) : null}
                            </p>
                            <p className="text-xs text-flame-500 truncate">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-bold text-flame-900 tabular-nums">
                        {r.avgScore}<span className="text-flame-400 text-xs">/100</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-flame-700 tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-flame-500" /> {formatDuration(r.avgTimeMs)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-flame-700 font-semibold">{r.contests}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-semibold text-flame-700 tabular-nums">
                        {r.bestScore}<span className="text-flame-400 text-xs">/100</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Top-3 podium hero. Renders nothing when there are fewer than 3 entries. */
function Podium({ rows, loading }) {
  if (loading || rows.length < 3) return null;
  const [first, second, third] = rows.slice(0, 3);
  const positions = [
    { row: second, place: 2, accent: 'bg-white border-flame-100',    badge: 'bg-flame-700 text-cream-100',  Icon: Award },
    { row: first,  place: 1, accent: 'bg-cream-300 border-cream-400', badge: 'bg-flame-900 text-cream-300', Icon: Trophy },
    { row: third,  place: 3, accent: 'bg-white border-flame-100',    badge: 'bg-flame-700 text-cream-100',  Icon: Medal },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
    >
      {positions.map((p, i) => (
        <motion.div
          key={p.row.userId}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
          className={`rounded-2xl border shadow-soft p-5 transition-shadow hover:shadow-[0_18px_50px_-18px_rgba(33,37,41,0.25)] ${p.accent} ${
            p.place === 1 ? 'sm:scale-[1.02]' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${p.badge}`}>
              <p.Icon className="w-3 h-3" /> Rank #{p.place}
            </span>
            <span className="text-2xl font-bold tabular-nums text-flame-900">
              {p.row.avgScore}<span className="text-flame-700/70 text-sm font-semibold">/100</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0 ${
              p.place === 1 ? 'bg-flame-900 text-cream-300' : 'bg-cream-300 text-flame-900'
            }`}>
              {p.row.name?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-flame-900 truncate inline-flex items-center gap-1.5">
                {p.row.name}
                {p.row.isMe ? <span className="badge bg-flame-900 text-cream-300 text-[9px]">You</span> : null}
              </p>
              <p className="text-xs text-flame-700/70 truncate">{p.row.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider font-semibold text-flame-700/80">
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(p.row.avgTimeMs)}</span>
            <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" /> {p.row.contests}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
