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
} from 'lucide-react';
import { authAPI } from '../services/api';

export default function Sidebar({ role = 'citizen' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const citizenMenu = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: PlusCircle, label: 'Report an Issue', path: '/report' },
    { icon: ListTodo, label: 'My Complaints', path: '/my-complaints' },
    { icon: Map, label: 'Explore Map', path: '/explore' },
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

  return (
    <>
      {/* Dedicated Mobile Top App Bar — prevents any overlap with page titles */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-b border-gray-200 z-[1200] flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-1 rounded-xl text-gray-800 hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div
            onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">CivicLens</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {role}
            </span>
          </div>
        </div>

        {role === 'citizen' ? (
          <button
            type="button"
            onClick={() => navigate('/report')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-white text-xs font-bold shadow-xs active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Report
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/admin/complaints')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
          >
            Complaints
          </button>
        )}
      </header>

      {/* Overlay for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[1250]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[1300]
          w-64 bg-primary text-white min-h-screen p-5 flex flex-col shrink-0
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5 text-white" />
            </div>
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

        {/* Menu Items */}
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

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            authAPI.logout();
            navigate('/');
            setIsMobileMenuOpen(false);
          }}
          className="mt-4 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
      </aside>
    </>
  );
}
