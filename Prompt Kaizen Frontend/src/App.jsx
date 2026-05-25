import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PromptAnalyzer from './pages/PromptAnalyzer.jsx';
import PromptResult from './pages/PromptResult.jsx';
import PromptHistory from './pages/PromptHistory.jsx';
import PromptDetails from './pages/PromptDetails.jsx';
import DailyChallenge from './pages/DailyChallenge.jsx';
import Contests from './pages/Contests.jsx';
import ContestTake from './pages/ContestTake.jsx';
import ContestLeaderboard from './pages/ContestLeaderboard.jsx';
import ContestSpecificLeaderboard from './pages/ContestSpecificLeaderboard.jsx';
import { useAuth } from './context/AuthContext.jsx';

function AppShell({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
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
  // Pass `location` to <Routes> so that during AnimatePresence's exit phase
  // the outgoing page keeps rendering the OLD route until its exit completes.
  // Without this, the old motion.div would render the new route's content
  // mid-exit, causing a visible flash.
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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analyze" element={<ProtectedRoute><PromptAnalyzer /></ProtectedRoute>} />
          <Route path="/challenge" element={<ProtectedRoute><DailyChallenge /></ProtectedRoute>} />
          <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
          <Route path="/contests/leaderboard" element={<ProtectedRoute><ContestLeaderboard /></ProtectedRoute>} />
          <Route path="/contests/:id/leaderboard" element={<ProtectedRoute><ContestSpecificLeaderboard /></ProtectedRoute>} />
          <Route path="/contests/:id" element={<ProtectedRoute><ContestTake /></ProtectedRoute>} />
          <Route path="/result/:id" element={<ProtectedRoute><PromptResult /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><PromptHistory /></ProtectedRoute>} />
          <Route path="/prompts/:id" element={<ProtectedRoute><PromptDetails /></ProtectedRoute>} />

          <Route
            path="*"
            element={
              <div className="max-w-3xl mx-auto p-10 text-center">
                <h1 className="text-2xl font-semibold text-flame-900">Page not found</h1>
                <p className="text-flame-400 mt-2">The page you were looking for doesn't exist.</p>
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
    <AppShell>
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
    </AppShell>
  );
}
