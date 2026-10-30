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
  Settings
} from 'lucide-react';

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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-primary text-white min-h-screen p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 mt-12 lg:mt-0">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">CivicLens</h1>
            <p className="text-xs text-gray-300 capitalize">{role} Portal</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-lg'
                    : 'text-gray-300 hover:bg-primary-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={() => {
            navigate('/');
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );
}
