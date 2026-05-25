import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, PlusCircle, Calendar, ChevronRight, Inbox,
  Clock, Users as UsersIcon, Layers, Lock, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance.js';
import ScoreCard from '../components/ScoreCard.jsx';

const STATUS_BADGE = {
  draft:     'bg-white text-flame-700 border border-flame-200',
  published: 'bg-cream-300 text-flame-900',
  closed:    'bg-flame-900 text-cream-200',
};

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/contests')
      .then((res) => setContests(res.data.contests || []))
      .catch((e) => toast.error(e?.response?.data?.message || 'Failed to load contests.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const total = contests.length;
    const scheduled = contests.filter((c) =>
      c.status === 'published' && (!c.endsAt || new Date(c.endsAt).getTime() > now)
    ).length;
    const closed = contests.filter((c) =>
      c.status === 'closed' || (c.endsAt && new Date(c.endsAt).getTime() <= now)
    ).length;
    const attendees = contests.reduce((sum, c) => sum + (c.submittedCount || 0), 0);
    // Weighted platform average: Σ(avgScore × submittedCount) / Σ(submittedCount).
    const scoreSum = contests.reduce(
      (sum, c) => sum + (c.avgScore || 0) * (c.submittedCount || 0),
      0
    );
    const avgScore = attendees > 0 ? Math.round((scoreSum / attendees) * 10) / 10 : 0;
    return { total, scheduled, closed, attendees, avgScore };
  }, [contests]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <span className="chip"><Trophy className="w-3.5 h-3.5" /> Weekly tests</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-flame-900">Contests</h1>
          <p className="text-flame-500 text-sm">
            Schedule a contest, define scenarios, and upload the allowlist of participants.
          </p>
        </div>
        <Link to="/contests/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" /> New Contest
        </Link>
      </motion.div>

      {contests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <ScoreCard title="Assigned Contests" value={stats.total}      Icon={Layers}       delay={0.00} />
          <ScoreCard title="Scheduled"         value={stats.scheduled}  Icon={Calendar}     delay={0.05} variant="flame" />
          <ScoreCard title="Closed"            value={stats.closed}     Icon={Lock}         delay={0.10} />
          <ScoreCard title="Total Attendees"   value={stats.attendees}  Icon={UsersIcon}    delay={0.15} variant="cream" />
          <ScoreCard title="Average Score"     value={stats.avgScore}   suffix="/100" Icon={BarChart3} delay={0.20} />
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-cream-100" />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-cream-100 text-flame-900 flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="mt-3 font-semibold text-flame-900">No contests yet</p>
            <p className="text-sm text-flame-500 mt-1">
              Click <span className="font-semibold">New Contest</span> to schedule the first one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-flame-400 border-b border-flame-50 bg-cream-50">
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Title</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Scheduled (IST)</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Scenarios</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Allowlist</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Submitted</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Status</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {contests.map((c, i) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="border-b border-flame-50/60 hover:bg-cream-50/60 transition"
                  >
                    <td className="py-2.5 px-4 font-semibold text-flame-900">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-flame-700" />
                        {c.title}
                      </div>
                      {c.description ? (
                        <p className="text-xs text-flame-500 mt-0.5 max-w-md truncate">{c.description}</p>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-4 text-flame-800 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-flame-700" />
                        {new Date(c.scheduledDate).toLocaleDateString(undefined, { timeZone: 'Asia/Kolkata' })}
                      </span>
                      {c.startsAt && c.endsAt ? (
                        <p className="text-[10px] text-flame-500 mt-0.5 inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" />
                          {new Date(c.startsAt).toLocaleTimeString(undefined, { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })}
                          {' – '}
                          {new Date(c.endsAt).toLocaleTimeString(undefined, { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })} IST
                        </p>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-4 text-flame-700 font-semibold">{c.scenariosCount}</td>
                    <td className="py-2.5 px-4 text-flame-700">
                      <span className="inline-flex items-center gap-1.5">
                        <UsersIcon className="w-3.5 h-3.5" /> {c.allowedCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-flame-700">
                      {c.submittedCount}<span className="text-flame-300"> / {c.allowedCount}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`badge ${STATUS_BADGE[c.status] || ''}`}>{c.status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <Link to={`/contests/${c._id}`} className="btn-ghost text-xs">
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
