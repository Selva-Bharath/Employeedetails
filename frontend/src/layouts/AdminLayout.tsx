import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Link as LinkIcon, 
  FileCheck, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  LayoutDashboard,
  Building2,
  Menu,
  X
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rawUser = localStorage.getItem('hr_user');
  const user = rawUser ? JSON.parse(rawUser) : null;

  const handleLogout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/links', label: 'Registration Links', icon: LinkIcon },
    { to: '/admin/employees', label: 'Employee Submissions', icon: Users },
    { to: '/admin/documents', label: 'Document Vault', icon: FileCheck },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  const currentSection = location.pathname.split('/')[2] || 'Dashboard';

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Enterprise Sidebar (Responsive: drawer on mobile, static on desktop) */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-neutral-800 bg-neutral-900 md:bg-neutral-900/60 backdrop-blur flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black tracking-wider shadow-sm">
                <Building2 className="w-4 h-4 text-black" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white uppercase">Acro HRMS</h1>
                <p className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">Admin Portal</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-300">
              {user?.full_name ? user.full_name[0] : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Admin User'}</p>
              <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 inline" /> {user?.role || 'HR Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-neutral-800 px-4 sm:px-6 md:px-8 flex items-center justify-between bg-neutral-950/80 sticky top-0 z-30 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile/tablet */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-200 hidden sm:inline">HR Admin</span>
              <span className="hidden sm:inline">/</span>
              <span className="capitalize font-medium text-white sm:text-neutral-400">{currentSection}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">PostgreSQL</span> Connected
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


