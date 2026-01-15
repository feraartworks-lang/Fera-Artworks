import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle, 
  Loader2, Trash2, Check, X
} from 'lucide-react';

const AdminAlerts = () => {
  const { adminApi } = useAdmin();
  
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await adminApi('get', '/admin/alerts');
      setAlerts(data);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await adminApi('put', `/admin/alerts/${alertId}/read`);
      setAlerts(alerts.map(a => a.alert_id === alertId ? {...a, is_read: true} : a));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await adminApi('put', '/admin/alerts/read-all');
      setAlerts(alerts.map(a => ({...a, is_read: true})));
      toast.success('All alerts marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await adminApi('delete', `/admin/alerts/${alertId}`);
      setAlerts(alerts.filter(a => a.alert_id !== alertId));
      toast.success('Alert deleted');
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getAlertBorder = (type) => {
    switch (type) {
      case 'critical': return 'border-l-red-500 bg-red-500/5';
      case 'error': return 'border-l-orange-500 bg-orange-500/5';
      case 'warning': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'info': return 'border-l-blue-500 bg-blue-500/5';
      default: return 'border-l-zinc-500 bg-zinc-500/5';
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div data-testid="admin-alerts">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-3">
            Alerts
            {unreadCount > 0 && (
              <Badge className="bg-red-500">{unreadCount} unread</Badge>
            )}
          </h1>
          <p className="text-zinc-500">System notifications and security alerts</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={markAllRead}
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl text-white font-serif mb-2">All Clear</h3>
            <p className="text-zinc-500">No alerts at this time. The system is running smoothly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card 
              key={alert.alert_id} 
              className={`bg-zinc-900 border-zinc-800 border-l-4 ${getAlertBorder(alert.type)} ${
                !alert.is_read ? 'ring-1 ring-white/10' : 'opacity-70'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium">{alert.title}</h3>
                      <Badge variant="outline" className={`text-xs capitalize ${
                        alert.type === 'critical' ? 'text-red-500 border-red-500' :
                        alert.type === 'error' ? 'text-orange-500 border-orange-500' :
                        alert.type === 'warning' ? 'text-yellow-500 border-yellow-500' :
                        'text-blue-500 border-blue-500'
                      }`}>
                        {alert.type}
                      </Badge>
                      {!alert.is_read && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span>Source: {alert.source}</span>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                    {alert.details && Object.keys(alert.details).length > 0 && (
                      <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono text-zinc-400">
                        {JSON.stringify(alert.details, null, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!alert.is_read && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => markAsRead(alert.alert_id)}
                        className="hover:bg-zinc-800"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteAlert(alert.alert_id)}
                      className="hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;
