import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Users from './pages/Users.jsx';
import Prompts from './pages/Prompts.jsx';
import PromptDetails from './pages/PromptDetails.jsx';
import Contests from './pages/Contests.jsx';
import ContestCreate from './pages/ContestCreate.jsx';
import ContestEdit from './pages/ContestEdit.jsx';
import ContestDetail from './pages/ContestDetail.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Shell({ children }) {
  const { user } = useAuth();
  return (
    // overflow-x-hidden keeps the page from ever scrolling horizontally; tables
    // inside individual pages provide their own overflow-x-auto so they scroll
    // within their card rather than pushing the whole page sideways.
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <div className="flex-1">
        {user ? (
          <main className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-8">
            {children}
          </main>
        ) : (
          <main>{children}</main>
        )}
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/prompts" element={<ProtectedRoute><Prompts /></ProtectedRoute>} />
          <Route path="/prompts/:id" element={<ProtectedRoute><PromptDetails /></ProtectedRoute>} />
          <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
          <Route path="/contests/new" element={<ProtectedRoute><ContestCreate /></ProtectedRoute>} />
          <Route path="/contests/:id/edit" element={<ProtectedRoute><ContestEdit /></ProtectedRoute>} />
          <Route path="/contests/:id" element={<ProtectedRoute><ContestDetail /></ProtectedRoute>} />
          <Route
            path="*"
            element={
              <div className="max-w-3xl mx-auto p-10 text-center">
                <h1 className="text-2xl font-semibold text-flame-900">Page not found</h1>
              </div>
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Shell>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#212529',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px 14px',
            boxShadow: '0 18px 40px -16px rgba(33,37,41,0.35)',
          },
          success: { iconTheme: { primary: '#F15D23', secondary: '#FFFFFF' } },
          error:   { iconTheme: { primary: '#F15D23', secondary: '#FFFFFF' } },
        }}
      />
      <AnimatedRoutes />
    </Shell>
  );
}
