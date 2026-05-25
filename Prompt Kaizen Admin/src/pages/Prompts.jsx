import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Eye, Inbox, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance.js';
import { ratingBadgeClass } from '../utils/scoreUtils.js';

// Rating tiers ranked highest → lowest. Used as the primary key when sorting
// by Rating; overallScore is the tiebreaker within the same tier.
const RATING_RANK = {
  'Excellent Prompt': 5,
  'Good Prompt': 4,
  'Average Prompt': 3,
  'Needs Improvement': 2,
  'Poor Prompt': 1,
};

export default function Prompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState(null);   // 'score' | 'rating' | null
  const [sortDir, setSortDir] = useState(null); // 'asc' | 'desc' | null

  // Three-click cycle on the same column: ascending → descending → cleared
  // (original DB order). Switching to a different column starts at ascending.
  const onSort = (key) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir('asc');
      return;
    }
    if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortBy(null);
      setSortDir(null);
    } else {
      setSortDir('asc');
    }
  };

  useEffect(() => {
    api.get('/admin/prompts')
      .then((res) => setPrompts(res.data.prompts || []))
      .catch((e) => toast.error(e?.response?.data?.message || 'Failed to load prompts.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(prompts.map((p) => p.category))).sort(),
    [prompts]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = prompts.filter((p) => {
      if (category && p.category !== category) return false;
      if (!query) return true;
      return (
        p.scenario.toLowerCase().includes(query) ||
        p.userPrompt.toLowerCase().includes(query) ||
        (p.userId?.name || '').toLowerCase().includes(query) ||
        (p.userId?.email || '').toLowerCase().includes(query)
      );
    });

    if (!sortBy || !sortDir) return list; // unsorted → original DB order

    // Sort by score: pure numeric.
    // Sort by rating: by tier rank, with overallScore as tiebreaker so two
    // "Average Prompt" rows are ordered by their numeric scores (higher on
    // top when descending, lower on top when ascending).
    const mult = sortDir === 'desc' ? -1 : 1;
    const sorted = list.slice().sort((a, b) => {
      if (sortBy === 'score') {
        return mult * ((a.overallScore || 0) - (b.overallScore || 0));
      }
      if (sortBy === 'rating') {
        const ra = RATING_RANK[a.rating] || 0;
        const rb = RATING_RANK[b.rating] || 0;
        if (ra !== rb) return mult * (ra - rb);
        return mult * ((a.overallScore || 0) - (b.overallScore || 0));
      }
      return 0;
    });
    return sorted;
  }, [prompts, q, category, sortBy, sortDir]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <span className="chip"><FileText className="w-3.5 h-3.5" /> Prompt evaluations</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-flame-900">Prompts</h1>
          <p className="text-flame-500 text-sm">{prompts.length} total evaluations on the platform.</p>
        </div>
      </motion.div>

      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-flame-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scenario, prompt, user..."
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
        <span className="badge-ghost ml-auto">{filtered.length} match{filtered.length === 1 ? '' : 'es'}</span>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-cream-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-cream-100 text-flame-900 flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="mt-3 font-semibold text-flame-900">No prompts match your filters</p>
            <p className="text-sm text-flame-500 mt-1">Try a different search or category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-flame-400 border-b border-flame-50 bg-cream-50">
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Date</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">User</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Category</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Scenario</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">
                    <SortHeader label="Score" colKey="score" sortBy={sortBy} sortDir={sortDir} onClick={onSort} />
                  </th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">
                    <SortHeader label="Rating" colKey="rating" sortBy={sortBy} sortDir={sortDir} onClick={onSort} />
                  </th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="border-b border-flame-50/60 hover:bg-cream-50/60 transition"
                  >
                    <td className="py-2.5 px-4 text-flame-500 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cream-300 text-flame-900 flex items-center justify-center text-[10px] font-bold uppercase">
                          {p.userId?.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-flame-900">{p.userId?.name || '—'}</p>
                          <p className="text-xs text-flame-500">{p.userId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-flame-800">{p.category}</td>
                    <td className="py-2.5 px-4 max-w-xs truncate text-flame-700" title={p.scenario}>{p.scenario}</td>
                    <td className="py-2.5 px-4 font-bold text-flame-900">{p.overallScore}</td>
                    <td className="py-2.5 px-4">
                      <span className={`badge ${ratingBadgeClass(p.rating)}`}>{p.rating}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link to={`/prompts/${p._id}`} className="btn-ghost text-xs">
                        <Eye className="w-3.5 h-3.5" /> View
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

function SortHeader({ label, colKey, sortBy, sortDir, onClick }) {
  const active = sortBy === colKey && !!sortDir;
  const Icon = active ? (sortDir === 'desc' ? ArrowDown : ArrowUp) : ArrowUpDown;
  const stateLabel = active ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'unsorted';
  return (
    <button
      type="button"
      onClick={() => onClick(colKey)}
      className={`inline-flex items-center gap-1 transition-colors ${
        active ? 'text-flame-900' : 'text-flame-400 hover:text-flame-700'
      }`}
      title={`Sort by ${label} — click cycles ascending → descending → off`}
      aria-label={`Sort by ${label}, currently ${stateLabel}`}
    >
      <span className="uppercase tracking-wider font-semibold">{label}</span>
      <Icon className={`w-3 h-3 ${active ? 'opacity-100' : 'opacity-50'}`} strokeWidth={2.4} />
    </button>
  );
}
