import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Sparkles, History, LogOut, LogIn, UserPlus, Menu, X, Calendar, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItem = ({ isActive }) =>
    `relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'text-white' : 'text-flame-900 hover:text-flame-500'
    }`;

  const links = user
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/analyze',   label: 'Analyze',   icon: Sparkles },
        { to: '/challenge', label: 'Challenge', icon: Calendar },
        { to: '/contests',  label: 'Contests',  icon: Trophy },
        { to: '/history',   label: 'History',   icon: History },
      ]
    : [];

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-40 glass border-b border-flame-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 shrink-0">
          <Logo />
          <div className="leading-tight">
            <p className="font-bold tracking-tight text-flame-500">Prompt Kaizen</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-flame-900 font-semibold">Compatibility Analyzer</p>
          </div>
        </Link>

        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navItem}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="navActive"
                        className="absolute inset-0 -z-10 rounded-lg bg-flame-500"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <l.icon className="w-4 h-4" strokeWidth={2} />
                    <span>{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-4 text-sm text-flame-400">
            <a href="#features" className="hover:text-flame-900 transition">Features</a>
            <a href="#how" className="hover:text-flame-900 transition">How it works</a>
            <a href="#scoring" className="hover:text-flame-900 transition">Scoring</a>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 pr-2">
                <div className="w-8 h-8 rounded-full bg-flame-900 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {user.name?.[0] || 'U'}
                </div>
                <span className="text-sm text-flame-900 hidden lg:inline">{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm border-flame-900" aria-label="Log out">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <button
                onClick={() => setOpen((v) => !v)}
                className="md:hidden btn-ghost p-2"
                aria-label="Menu"
              >
                {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer (authed) */}
      {user && open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden border-t border-flame-50 bg-white"
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-flame-500 text-white' : 'text-flame-900'
                  }`
                }
              >
                <l.icon className="w-4 h-4" />
                <span>{l.label}</span>
              </NavLink>
            ))}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
