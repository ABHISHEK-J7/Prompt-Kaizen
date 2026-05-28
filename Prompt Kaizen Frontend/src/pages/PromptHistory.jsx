import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  History, PlusCircle, Search, Eye, Inbox, Sparkles, Filter, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance.js';
import { ratingBadgeClass } from '../utils/scoreUtils.js';

export default function PromptHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/prompts/history')
      .then((res) => setItems(res.data.items || []))
      .catch((e) => toast.error(e?.response?.data?.message || 'Failed to load history.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((i) => {
      if (category && i.category !== category) return false;
      if (!query) return true;
      return (
        (i.scenario || '').toLowerCase().includes(query) ||
        (i.userPrompt || '').toLowerCase().includes(query)
      );
    });
  }, [items, q, category]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <span className="chip"><History className="w-3.5 h-3.5" /> Prompt history</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-flame-900">All your evaluations</h1>
          <p className="text-flame-500 text-sm">Search, filter, and review what you've written before.</p>
        </div>
        <Link to="/analyze" className="btn-primary">
          <PlusCircle className="w-4 h-4" /> New Analysis
        </Link>
      </motion.div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-flame-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scenario or prompt..."
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-flame-300" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input pl-9 min-w-[200px]">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <span className="badge-ghost ml-auto">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-cream-50/60" />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-cream-100 text-flame-900 flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="mt-3 font-semibold text-flame-900">Nothing here yet</p>
            <p className="text-sm text-flame-500 mt-1">
              {items.length === 0 ? 'Analyze your first prompt to get started.' : 'No prompts match your filters.'}
            </p>
            {items.length === 0 && (
              <Link to="/analyze" className="btn-cream mt-4 inline-flex">
                <Sparkles className="w-4 h-4" /> Start your first analysis
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-flame-400 border-b border-flame-50 bg-cream-50/40">
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Date</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Category</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Scenario</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Original Prompt</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Score</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Rating</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const isChallenge = !!r.isDailyChallenge;
                  return (
                    <motion.tr
                      key={r._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }}
                      className={`border-b border-flame-50/60 transition ${
                        isChallenge
                          ? 'bg-cream-100/60 hover:bg-cream-200/70'
                          : 'hover:bg-cream-50/40'
                      }`}
                    >
                      <td
                        className={`py-2.5 px-4 whitespace-nowrap ${
                          isChallenge
                            ? 'text-flame-800 font-semibold relative'
                            : 'text-flame-500'
                        }`}
                      >
                        {/* Left accent stripe — uses box-shadow so it doesn't shift the layout. */}
                        {isChallenge && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-0 bottom-0 w-1 bg-flame-900"
                          />
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          {isChallenge && <Calendar className="w-3.5 h-3.5 text-flame-900" />}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-flame-800">
                        <span className="inline-flex items-center gap-2 flex-wrap">
                          <span>{r.category}</span>
                          {isChallenge && (
                            <span
                              className="badge bg-flame-900 text-cream-300"
                              title="Submitted via the Daily Challenge"
                            >
                              <Calendar className="w-3 h-3" /> Challenge
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 max-w-xs truncate text-flame-700" title={r.scenario}>{r.scenario}</td>
                      <td className="py-2.5 px-4 max-w-xs truncate text-flame-500" title={r.userPrompt}>{r.userPrompt}</td>
                      <td className="py-2.5 px-4 font-bold text-flame-900">{r.overallScore}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`badge ${ratingBadgeClass(r.rating)} whitespace-nowrap`}>
                          {r.rating || 'Unrated'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <Link to={`/prompts/${r._id}`} className="btn-ghost text-xs">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
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
