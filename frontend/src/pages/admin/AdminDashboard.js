import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, Image, DollarSign, TrendingUp, AlertTriangle, 
  ShoppingCart, RefreshCw, Ban, Clock, Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const { adminApi } = useAdmin();
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, alertsData] = await Promise.all([
          adminApi('get', '/admin/stats'),
          adminApi('get', '/admin/alerts?unread_only=true')
        ]);
        setStats(statsData);
        setRecentAlerts(alertsData.slice(0, 5));
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [adminApi]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Total Artworks', value: stats?.total_artworks || 0, icon: Image, color: 'text-green-500' },
    { label: 'Transactions', value: stats?.total_transactions || 0, icon: Clock, color: 'text-purple-500' },
    { label: 'Active Listings', value: stats?.active_listings || 0, icon: ShoppingCart, color: 'text-yellow-500' },
    { label: 'Banned Users', value: stats?.banned_users || 0, icon: Ban, color: 'text-red-500' },
    { label: 'Est. Revenue', value: `$${stats?.estimated_revenue || 0}`, icon: DollarSign, color: 'text-emerald-500' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500">Platform overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">{stat.label}</p>
                    <p className="font-mono text-2xl text-white mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Breakdown */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white font-serif">Transaction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.transaction_breakdown?.length > 0 ? (
                stats.transaction_breakdown.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded">
                    <div className="flex items-center gap-3">
                      {item._id === 'purchase' && <ShoppingCart className="w-5 h-5 text-green-500" />}
                      {item._id === 'p2p_sale' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                      {item._id === 'refund' && <RefreshCw className="w-5 h-5 text-yellow-500" />}
                      {item._id === 'withdrawal' && <DollarSign className="w-5 h-5 text-purple-500" />}
                      <span className="text-white capitalize">{item._id?.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-white">${item.total?.toFixed(2)}</p>
                      <p className="text-xs text-zinc-500">{item.count} transactions</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-center py-4">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white font-serif flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div 
                    key={alert.alert_id} 
                    className={`p-3 rounded border-l-2 ${
                      alert.type === 'critical' ? 'bg-red-500/10 border-red-500' :
                      alert.type === 'error' ? 'bg-orange-500/10 border-orange-500' :
                      alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                      'bg-blue-500/10 border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{alert.title}</span>
                      <Badge variant="outline" className={`text-xs ${
                        alert.type === 'critical' ? 'text-red-500' :
                        alert.type === 'error' ? 'text-orange-500' :
                        alert.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-zinc-400 text-xs">{alert.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500">No unread alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
