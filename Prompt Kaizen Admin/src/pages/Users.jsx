import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon, Search, ShieldCheck, Inbox, Upload, Trash2, KeyRound, Loader2, FileSpreadsheet, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDialog } from '../components/Dialog.jsx';
import { roleBadgeClass } from '../utils/scoreUtils.js';

export default function Users() {
  const { user: me } = useAuth();
  const dialog = useDialog();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/users')
      .then((res) => setUsers(res.data.users || []))
      .catch((e) => toast.error(e?.response?.data?.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query)
    );
  }, [users, q]);

  const adminCount = users.filter((u) => u.role === 'admin').length;

  // Hits GET /admin/users/export which streams an .xlsx of (Name, Email) for
  // every user. We pull it as a Blob, build an object URL, and trigger a
  // synthetic anchor click so the browser saves it to Downloads. The server
  // already sets Content-Disposition with a date-stamped filename; we mirror
  // it client-side as a fallback in case the browser strips that header.
  const onExportUsers = async () => {
    try {
      setExporting(true);
      const res = await api.get('/admin/users/export', { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      // Try to read the server-supplied filename; fall back to a local one.
      const disposition = res.headers?.['content-disposition'] || '';
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const filename = match?.[1] || `prompt-kaizen-users-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Users exported.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to export users.');
    } finally {
      setExporting(false);
    }
  };

  const onUploadFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setUploading(true);
      const { data } = await api.post('/admin/users/bulk-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const lines = [`${data.created} created`];
      if (data.skippedDuplicates) lines.push(`${data.skippedDuplicates} duplicate${data.skippedDuplicates === 1 ? '' : 's'} skipped`);
      if (data.skippedInvalid)    lines.push(`${data.skippedInvalid} invalid row${data.skippedInvalid === 1 ? '' : 's'}`);
      toast.success(lines.join(' · '));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (u) => {
    const ok = await dialog.confirm({
      title: `Delete ${u.name || 'this user'}?`,
      message: `${u.email}\n\nTheir prompts and contest submissions will also be deleted. This cannot be undone.`,
      confirmLabel: 'Delete user',
      destructive: true,
    });
    if (!ok) return;
    try {
      setRowBusyId(u._id);
      await api.delete(`/admin/users/${u._id}`);
      toast.success('User deleted.');
      setUsers((arr) => arr.filter((x) => x._id !== u._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete user.');
    } finally {
      setRowBusyId(null);
    }
  };

  const onResetPassword = async (u) => {
    const pwd = await dialog.prompt({
      title: 'Reset password',
      message: `Set a new password for ${u.email} (at least 6 characters).`,
      placeholder: 'New password',
      type: 'password',
      confirmLabel: 'Reset password',
      validate: (v) => (String(v || '').length < 6 ? 'Password must be at least 6 characters.' : ''),
    });
    if (pwd === null) return;
    try {
      setRowBusyId(u._id);
      await api.post(`/admin/users/${u._id}/reset-password`, { password: pwd });
      toast.success(`Password reset for ${u.email}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setRowBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <span className="chip"><UsersIcon className="w-3.5 h-3.5" /> All members</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-flame-900">Users</h1>
          <p className="text-flame-500 text-sm">
            {users.length} total · <span className="text-flame-900 font-semibold">{adminCount} admin</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onUploadFile}
          />
          <button
            type="button"
            onClick={onExportUsers}
            disabled={exporting || loading}
            className="btn-ghost text-sm"
            title="Download every user's name and email as an Excel file"
          >
            {exporting ? (
              <><Loader2 className="w-4 h-4 animate-spin-slow" /> Exporting…</>
            ) : (
              <><Download className="w-4 h-4" /> Export users</>
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-sm"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin-slow" /> Uploading…</>
            ) : (
              <><Upload className="w-4 h-4" /> Bulk upload</>
            )}
          </button>
        </div>
      </motion.div>

      <div className="card p-4 flex flex-wrap items-start gap-3 border-l-4 border-l-flame-500">
        <span className="w-10 h-10 rounded-xl bg-flame-500 text-white flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-flame-900">Excel / CSV format</p>
          <p className="text-sm text-flame-500 mt-0.5">
            No header row. Three columns per row, in this order: <span className="font-semibold text-flame-900">Name</span>,{' '}
            <span className="font-semibold text-flame-900">Email</span>,{' '}
            <span className="font-semibold text-flame-900">Password</span> (min 6 chars).
            Existing emails are skipped automatically.
          </p>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-flame-300" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email..."
            className="input pl-9"
          />
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
            <p className="mt-3 font-semibold text-flame-900">No users match your search</p>
            <p className="text-sm text-flame-500 mt-1">Try a different name or email.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-flame-400 border-b border-flame-50 bg-cream-50">
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Name</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Email</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Role</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold">Joined</th>
                  <th className="py-2 px-4 text-[11px] uppercase tracking-wider font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const isMe = me && String(me._id || me.id) === String(u._id);
                  const isAdmin = u.role === 'admin';
                  const rowBusy = rowBusyId === u._id;
                  const lockDelete = isMe || isAdmin;
                  const lockReason = isMe ? 'You cannot delete yourself.' : isAdmin ? 'Cannot delete an admin account.' : '';

                  return (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="border-b border-flame-50/60 hover:bg-cream-50/60 transition"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cream-300 text-flame-900 flex items-center justify-center text-xs font-bold uppercase">
                            {u.name?.[0] || 'U'}
                          </div>
                          <span className="font-medium text-flame-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-flame-600">{u.email}</td>
                      <td className="py-2.5 px-4">
                        <span className={`badge ${roleBadgeClass(u.role)}`}>
                          {isAdmin ? <ShieldCheck className="w-3 h-3" /> : null}
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-flame-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onResetPassword(u)}
                            disabled={rowBusy}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-flame-300 text-flame-900 hover:bg-flame-500 hover:text-white hover:border-flame-500 transition disabled:opacity-50"
                            title="Reset password"
                            aria-label="Reset password"
                          >
                            {rowBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin-slow" /> : <KeyRound className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(u)}
                            disabled={rowBusy || lockDelete}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-flame-300 text-flame-900 hover:bg-flame-900 hover:text-white hover:border-flame-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            title={lockReason || 'Delete user'}
                            aria-label="Delete user"
                          >
                            {rowBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin-slow" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
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
