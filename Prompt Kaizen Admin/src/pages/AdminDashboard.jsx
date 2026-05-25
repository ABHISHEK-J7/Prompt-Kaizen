import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon, FileText, Sparkles, Layers, Activity,
  ChevronRight, Inbox, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance.js';
import ScoreCard from '../components/ScoreCard.jsx';
import ChartCard from '../components/ChartCard.jsx';
import { ratingBadgeClass, roleBadgeClass } from '../utils/scoreUtils.js';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/admin/stats')
      .then((res) => mounted && setData(res.data))
      .catch((e) => toast.error(e?.response?.data?.message || 'Failed to load admin stats.'))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <LoadingDashboard />;
  if (!data)   return null;

  const categoryData = Object.entries(data.categoryCount || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <span className="chip"><Activity className="w-3.5 h-3.5" /> Platform overview</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-flame-900">Admin Overview</h1>
          <p className="text-flame-500 text-sm">Platform-wide stats across all users and prompts.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Total Users"        value={data.totalUsers}                Icon={UsersIcon} delay={0.00} />
        <ScoreCard title="Total Prompts"      value={data.totalPrompts}              Icon={FileText}  delay={0.05} variant="clay" />
        <ScoreCard title="Avg Platform Score" value={data.averagePlatformScore} suffix="/100" Icon={Sparkles} delay={0.10} variant="cream" />
        <ScoreCard title="Categories Used"    value={Object.keys(data.categoryCount || {}).length} Icon={Layers} delay={0.15} />
      </div>

      <ChartCard title="Prompts by category" subtitle="Across the whole platform" Icon={Layers}>
        {categoryData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-flame-400">No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#F15D23" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#F15D23" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF" />
              <XAxis dataKey="name" stroke="#6c757d" fontSize={10} angle={-15} textAnchor="end" height={60} interval={0} />
              <YAxis stroke="#6c757d" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#212529', border: 'none', borderRadius: 12, color: '#FFFFFF' }}
                cursor={{ fill: 'rgba(255,255,255,0.4)' }}
              />
              <Bar dataKey="value" name="Prompts" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="stat-icon"><UsersIcon className="w-5 h-5" /></span>
              <h3 className="font-semibold text-flame-900">Recent users</h3>
            </div>
            <Link to="/users" className="text-sm font-semibold text-flame-900 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              All users <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {data.recentUsers?.length === 0 ? (
            <EmptyState msg="No users yet." />
          ) : (
            <ul className="divide-y divide-flame-50">
              {data.recentUsers.map((u, i) => (
                <motion.li
                  key={u._id}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="py-2.5 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-cream-300 text-flame-900 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {u.name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-flame-900 truncate">{u.name}</p>
                      <p className="text-flame-500 text-xs truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${roleBadgeClass(u.role)}`}>
                    {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : null}
                    {u.role}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="stat-icon"><FileText className="w-5 h-5" /></span>
              <h3 className="font-semibold text-flame-900">Recent evaluations</h3>
            </div>
            <Link to="/prompts" className="text-sm font-semibold text-flame-900 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              All prompts <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {data.recentPrompts?.length === 0 ? (
            <EmptyState msg="No prompts yet." />
          ) : (
            <ul className="divide-y divide-flame-50">
              {data.recentPrompts.map((p, i) => (
                <motion.li
                  key={p._id}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="py-2.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-flame-900 truncate">{p.scenario}</p>
                      <p className="text-flame-500 text-xs truncate">
                        {p.category} · by {p.userId?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-flame-900">{p.overallScore}</span>
                      <span className={`badge ${ratingBadgeClass(p.rating)}`}>{p.rating}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-cream-100 text-flame-900 flex items-center justify-center">
        <Inbox className="w-6 h-6" />
      </div>
      <p className="mt-3 text-sm text-flame-500">{msg}</p>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-flame-50 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-flame-50 shimmer-bg animate-shimmer" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white border border-flame-50 shimmer-bg animate-shimmer" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-2xl bg-white border border-flame-50 shimmer-bg animate-shimmer" />
        <div className="h-64 rounded-2xl bg-white border border-flame-50 shimmer-bg animate-shimmer" />
      </div>
    </div>
  );
}
