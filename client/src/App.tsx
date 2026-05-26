import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";

// Pages
import Home from "./pages/Home";
import Factory from "./pages/Factory";
import Agents from "./pages/Agents";
import Workspace from "./pages/Workspace";
import Evolution from "./pages/Evolution";
import Maintenance from "./pages/Maintenance";
import MoE from "./pages/MoE";
import Projects from "./pages/Projects";
import Earnings from "./pages/Earnings";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import Assistants from "./pages/Assistants";
import Skills from "./pages/Skills";
import MCPPage from "./pages/MCPPage";
import ModelProviders from "./pages/ModelProviders";
import AdminDashboardPage, { AdminLayout } from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsers";
import AdminSettingsPage from "./pages/admin/AdminSettings";
import AdminOrdersPage from "./pages/admin/AdminOrders";
import { AdminBuildsPage, AdminAnnouncementsPage } from "./pages/admin/AdminBuilds";
import MoneyCommunity from "./pages/MoneyCommunity";
import AgentTeam from "./pages/AgentTeam";
import PaymentPage from "./pages/Payment";

// Pages that use the full AppLayout (dashboard-style)
const LAYOUT_ROUTES = [
  { path: "/",             Component: Home },
  { path: "/factory",      Component: Factory },
  { path: "/agents",       Component: Agents },
  { path: "/workspace",    Component: Workspace },
  { path: "/evolution",    Component: Evolution },
  { path: "/maintenance",  Component: Maintenance },
  { path: "/moe",          Component: MoE },
  { path: "/projects",     Component: Projects },
  { path: "/earnings",     Component: Earnings },
  { path: "/subscription", Component: Subscription },
  { path: "/settings",     Component: Settings },
  { path: "/assistants",   Component: Assistants },
  { path: "/skills",       Component: Skills },
  { path: "/mcp-servers",  Component: MCPPage },
  { path: "/providers",    Component: ModelProviders },
  { path: "/community",    Component: MoneyCommunity },
  { path: "/agent-team",   Component: AgentTeam },
  { path: "/payment",      Component: PaymentPage },
];

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboardPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/admin/orders" component={AdminOrdersPage} />
        <Route path="/admin/builds" component={AdminBuildsPage} />
        <Route path="/admin/announcements" component={AdminAnnouncementsPage} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={AdminRouter} />
      <Route path="/admin/:rest*" component={AdminRouter} />
      <Route>
        <AppLayout>
          <Switch>
            {LAYOUT_ROUTES.map(({ path, Component }) => (
              <Route key={path} path={path} component={Component} />
            ))}
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
