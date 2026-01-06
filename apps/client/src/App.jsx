// src/App.jsx
import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { SidebarProvider } from "./shadcn/ui/sidebar";

import AdminLayout from "./layouts/adminLayout";
import PortalLayout from "./layouts/portalLayout";
import AgentsLayout from "./layouts/agentLayout";

import Home from "./pages/index";
import NotificationsPage from "./pages/notifications";
import OnboardingPage from "./pages/onboarding";
import ProfilePage from "./pages/profile";
import SubmitPage from "./pages/submit";
import NotFoundPage from "./pages/404";
import LoginPage from "./pages/auth/login";

import Inbox from "./pages/inbox";
import Ticket from "./pages/tickets";
import NewTicket from "./pages/tickets/new";
import TicketDetail from "./pages/tickets/detail";
import TicketSearch from "./pages/tickets/search";

import Users from "./pages/admin/users";
import NewUser from "./pages/admin/users/new";
import Clients from "./pages/admin/clients";
import NewClient from "./pages/admin/clients/new";
import EmailQueuesList from "./pages/admin/email-queues";
import NewEmailQueue from "./pages/admin/email-queues/new";
import Webhooks from "./pages/admin/webhooks";
import SMTP from "./pages/admin/smtp";
import OAuth from "./pages/admin/smtp/oauth";
import Authentication from "./pages/admin/authentication";
import Roles from "./pages/admin/roles";
import NewRole from "./pages/admin/roles/new";
import Logs from "./pages/admin/logs";

import { useUser } from "./store/session";

/* ============================================================
   ERROR BOUNDARY
============================================================ */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center text-red-500 p-4 bg-red-50">
          <div>
            <p>Something went wrong: {this.state.error?.message || "Unknown"}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================================================
   ROLE-BASED ACCESS CONTROL
============================================================ */
function RequireRole({ children, adminOnly, agentOnly }) {
  const { user, loading, isAdmin, isAgent } = useUser();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  useEffect(() => {
    if (!user) return;

    if (adminOnly && !isAdmin) navigate("/portal", { replace: true });
    if (agentOnly && !isAgent) navigate("/portal", { replace: true });

    if (isAdmin && !adminOnly) navigate("/admin", { replace: true });
    if (isAgent && !agentOnly && !adminOnly)
      navigate("/agents/tickets?status=open", { replace: true });
  }, [user]);

  return children;
}

/* ============================================================
   AUTO-REDIRECT AFTER LOGIN
============================================================ */
function RedirectAfterLogin() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    if (!location.pathname.startsWith("/auth")) return;

    if (user.isAdmin) navigate("/admin", { replace: true });
    else if (user.isAgent) navigate("/agents/tickets?status=open", { replace: true });
    else navigate("/portal", { replace: true });
  }, [user]);

  return null;
}

/* ============================================================
   MAIN APP
============================================================ */
function App() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin h-12 w-12 border-b-2 border-primary rounded-full"></div>
        <p className="ml-4">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider>
      <ErrorBoundary>
        <RedirectAfterLogin />

        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/submit" element={<SubmitPage />} />

          {/* ============================================================
             PORTAL (Customers / Normal Users)
          ============================================================== */}
          <Route
            path="/portal"
            element={
              <RequireRole>
                <PortalLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="inbox" replace />} />
            <Route path="inbox" element={<Inbox />} />

            {/* Ticket routes */}
            <Route path="tickets">
              <Route index element={<Ticket />} />
              <Route path="new" element={<NewTicket />} />
              <Route path="search" element={<TicketSearch />} />
              <Route path=":id" element={<TicketDetail />} />
            </Route>

            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ============================================================
             AGENTS (Support Agents)
          ============================================================== */}
          <Route
            path="/agents"
            element={
              <RequireRole agentOnly>
                <AgentsLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="tickets?status=open" replace />} />

            <Route path="tickets">
              <Route index element={<Ticket />} />
              <Route path="new" element={<NewTicket />} />
              <Route path="search" element={<TicketSearch />} />
              <Route path=":id" element={<TicketDetail />} />
            </Route>

            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ============================================================
             ADMIN
          ============================================================== */}
          <Route
            path="/admin"
            element={
              <RequireRole adminOnly>
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="users" replace />} />

            <Route path="users" element={<Users />} />
            <Route path="users/new" element={<NewUser />} />

            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<NewClient />} />

            <Route path="email-queues" element={<EmailQueuesList />} />
            <Route path="email-queues/new" element={<NewEmailQueue />} />

            <Route path="webhooks" element={<Webhooks />} />
            <Route path="smtp" element={<SMTP />} />
            <Route path="smtp/oauth" element={<OAuth />} />
            <Route path="authentication" element={<Authentication />} />
            <Route path="roles" element={<Roles />} />
            <Route path="roles/new" element={<NewRole />} />
            <Route path="logs" element={<Logs />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </SidebarProvider>
  );
}

export default App;
