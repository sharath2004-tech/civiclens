import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListTodo,
  Map,
  User,
  MapPin,
  Users,
  TrendingUp,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  Home,
  ClipboardList,
} from 'lucide-react';
import { authAPI } from '../services/api';

export default function Sidebar({ role = 'citizen' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const citizenMenu = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Map, label: 'Explore Map', path: '/explore' },
    { icon: PlusCircle, label: 'Report Issue', path: '/report' },
    { icon: ClipboardList, label: 'My Complaints', path: '/my-complaints' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const adminMenu = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: ListTodo, label: 'All Complaints', path: '/admin/complaints' },
    { icon: Map, label: 'Issue Map', path: '/admin/map' },
    { icon: TrendingUp, label: 'Priority Queue', path: '/admin/priority-queue' },
    { icon: Users, label: 'Departments', path: '/admin/departments' },
    { icon: User, label: 'Workers', path: '/admin/workers' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const menuItems = role === 'admin' ? adminMenu : citizenMenu;

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    authAPI.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsMobileMenuOpen(false);
    // Full reload so the app's in-memory user state is cleared
    window.location.replace('/login');
  };

  return (
    <>
      {/* Clean Mobile Top Brand Bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-[#F8FAFC]/95 backdrop-blur-md z-[1200] flex items-center justify-between px-5">
        <div
          onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="CivicLens Logo"
            className="w-9 h-9 bg-white rounded-xl object-contain border border-slate-200/80 p-0.5 shadow-2xs"
          />
          <span className="font-bold text-gray-900 text-base tracking-tight">CivicLens</span>
        </div>

        {role === 'admin' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:bg-gray-200/60"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (matches the 5-icon bar from the mockup!) */}
      {role === 'citizen' ? (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-100 z-[1200] flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          {citizenMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </button>
            );
          })}
        </nav>
      ) : (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-100 z-[1200] flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          {[adminMenu[0], adminMenu[1], adminMenu[2], adminMenu[3], adminMenu[6]].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </button>
            );
          })}
        </nav>
      )}

      {/* Overlay for mobile drawer (Admin extra links) */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[1250]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar / Mobile Admin Drawer */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[1300]
          w-64 bg-primary text-white min-h-screen p-5 flex flex-col shrink-0
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CivicLens Logo"
              className="w-10 h-10 bg-white rounded-xl object-contain p-0.5 shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight">CivicLens</h1>
              <p className="text-xs text-gray-300 capitalize">{role} Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-accent text-white font-semibold shadow-md'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white font-medium'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
      </aside>
    </>
  );
}
