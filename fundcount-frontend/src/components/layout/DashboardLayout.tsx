import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  TrendingUp,
  Users,
  Building2,
  Database,
  BarChart3,
  Settings,
  DollarSign,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Brain,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface NavSection {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: { label: string; path: string }[];
}

const navigation: NavSection[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    label: 'General Ledger',
    icon: BookOpen,
    children: [
      { label: 'Chart of Accounts', path: '/general-ledger/chart-of-accounts' },
      { label: 'Journal Entries', path: '/general-ledger/journal-entries' },
      { label: 'Trial Balance', path: '/general-ledger/trial-balance' },
      { label: 'Reconciliation', path: '/general-ledger/reconciliation' },
    ],
  },
  {
    label: 'Portfolio',
    icon: Briefcase,
    children: [
      { label: 'Portfolios', path: '/portfolio/portfolios' },
      { label: 'Assets', path: '/portfolio/assets' },
      { label: 'Positions', path: '/portfolio/positions' },
      { label: 'Trades', path: '/portfolio/trades' },
    ],
  },
  {
    label: 'Performance',
    icon: TrendingUp,
    children: [
      { label: 'Attribution', path: '/performance/attribution' },
      { label: 'Returns Analysis', path: '/performance/returns' },
    ],
  },
  {
    label: 'Partnership',
    icon: Users,
    children: [
      { label: 'Partners', path: '/partnership/partners' },
      { label: 'Capital Accounts', path: '/partnership/capital-accounts' },
      { label: 'Allocations', path: '/partnership/allocations' },
    ],
  },
  { label: 'Investor Portal', icon: Building2, path: '/investor-portal' },
  {
    label: 'Data',
    icon: Database,
    children: [
      { label: 'Sources', path: '/data/sources' },
      { label: 'Imports', path: '/data/imports' },
    ],
  },
  {
    label: 'AI Intelligence',
    icon: Brain,
    children: [
      { label: 'AI Dashboard', path: '/ai/dashboard' },
      { label: 'Portfolio Analysis', path: '/ai/portfolio-analysis' },
      { label: 'Ask AI', path: '/ai/query' },
      { label: 'Predictions', path: '/ai/predictions' },
      { label: 'Reconciliation', path: '/ai/reconciliation' },
      { label: 'NAV Calculator', path: '/ai/nav-calculator' },
    ],
  },
  {
    label: 'Compliance',
    icon: Shield,
    children: [
      { label: 'Dashboard', path: '/compliance/dashboard' },
      { label: 'Regulatory Checks', path: '/compliance/regulatory' },
      { label: 'Filings', path: '/compliance/filings' },
      { label: 'Tax Lots', path: '/compliance/tax-lots' },
      { label: 'GIPS Composites', path: '/compliance/gips' },
      { label: 'Audit Trail', path: '/compliance/audit-trail' },
    ],
  },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-slate-900 text-white flex flex-col transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          {!collapsed && <span className="text-lg font-bold">MultiFund AI</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            if (item.path) {
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            }

            const isExpanded = expandedSections.has(item.label);

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleSection(item.label)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && item.children && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-slate-700/50 pl-4">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="border-t border-slate-700/50 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <>
                <PanelLeftClose className="w-5 h-5 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="text-sm text-gray-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-emerald-500 text-white border-0">
                3
              </Badge>
            </button>

            {/* User info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
