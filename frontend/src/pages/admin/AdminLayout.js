import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Shield, LayoutDashboard, Image, Users, Clock, FileText, 
  Bell, LogOut, Download, Settings, AlertTriangle, Menu, X,
  ChevronRight
} from 'lucide-react';

const AdminLayout = () => {
  const { admin, adminToken, verifyAdmin, adminLogout, adminApi } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const isValid = await verifyAdmin();
      if (!isValid) {
        navigate('/admin/login');
      }
      setIsVerifying(false);
    };
    verify();
  }, [verifyAdmin, navigate]);

  useEffect(() => {
    const fetchAlertCount = async () => {
      if (!adminToken) return;
      try {
        const data = await adminApi('get', '/admin/alerts/count');
        setAlertCount(data.unread_count);
      } catch (error) {
        console.error('Failed to fetch alert count');
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [adminToken, adminApi]);

  const handleLogout = () => {
    adminLogout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 animate-pulse">Verifying admin access...</div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/artworks', icon: Image, label: 'Artworks' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/transactions', icon: Clock, label: 'Transactions' },
    { path: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
    { path: '/admin/alerts', icon: Bell, label: 'Alerts', badge: alertCount },
    { path: '/admin/reports', icon: Download, label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-black text-white" data-testid="admin-layout">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg">ArtChain Admin</h1>
            <p className="text-xs text-zinc-500">Founder Control Panel</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {alertCount > 0 && (
            <Link to="/admin/alerts">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-zinc-400" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {alertCount}
                </span>
              </Button>
            </Link>
          )}
          
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Logged in as</span>
            <span className="text-red-500 font-mono">{admin?.email}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                  isActive 
                    ? 'bg-red-500/10 text-red-500 border-l-2 border-red-500' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                onClick={() => setSidebarOpen(false)}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white">
                    {item.badge}
                  </Badge>
                )}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded text-xs">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Security Notice</span>
            </div>
            <p className="text-zinc-600">
              All actions are logged and monitored. Session auto-expires after 7 days.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'md:ml-64' : ''
      } md:ml-64`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
