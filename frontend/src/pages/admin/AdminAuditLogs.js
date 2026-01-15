import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Search, Loader2, FileText, Clock, User, Image as ImageIcon,
  AlertTriangle, Trash2
} from 'lucide-react';

const AdminAuditLogs = () => {
  const { adminApi } = useAdmin();
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArtwork, setFilterArtwork] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterArtwork]);

  const fetchData = async () => {
    try {
      const endpoint = filterArtwork 
        ? `/admin/audit-logs?artwork_id=${filterArtwork}`
        : '/admin/audit-logs';
      const [logsData, statsData] = await Promise.all([
        adminApi('get', endpoint),
        adminApi('get', '/admin/audit-logs/stats')
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const colors = {
      'user_registered': 'bg-blue-500',
      'user_login': 'bg-green-500',
      'admin_login': 'bg-red-500',
      'artwork_created': 'bg-purple-500',
      'artwork_updated': 'bg-purple-400',
      'artwork_deleted': 'bg-red-400',
      'artwork_purchased': 'bg-green-500',
      'artwork_downloaded': 'bg-yellow-500',
      'p2p_sale': 'bg-blue-500',
      'refund_processed': 'bg-orange-500',
      'manual_refund': 'bg-orange-600',
      'manual_transfer': 'bg-cyan-500',
      'user_ban': 'bg-red-500',
      'user_suspend': 'bg-yellow-500',
      'user_unban': 'bg-green-500',
      'withdrawal_requested': 'bg-purple-500'
    };
    return colors[action] || 'bg-zinc-500';
  };

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id?.includes(searchTerm) ||
    log.artwork_id?.includes(searchTerm) ||
    log.log_id?.includes(searchTerm)
  );

  return (
    <div data-testid="admin-audit-logs">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-white">Audit Logs</h1>
        <p className="text-zinc-500">Track all platform activities and changes</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Total Logs</p>
                  <p className="font-mono text-2xl text-white">{stats.total_logs}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Active Logs</p>
                  <p className="font-mono text-2xl text-green-500">{stats.active_logs}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Pending Deletion</p>
                  <p className="font-mono text-2xl text-yellow-500">{stats.pending_deletion}</p>
                </div>
                <Trash2 className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search by action, user ID, or log ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        <div className="relative w-64">
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Filter by artwork ID..."
            value={filterArtwork}
            onChange={(e) => setFilterArtwork(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white font-mono"
          />
        </div>
        {filterArtwork && (
          <Button 
            variant="ghost" 
            onClick={() => setFilterArtwork('')}
            className="text-zinc-400"
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded mb-6">
        <div className="flex items-center gap-2 text-yellow-500">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Log Retention Policy</span>
        </div>
        <p className="text-yellow-500/80 text-sm mt-1">
          Audit logs are automatically deleted 3 days after a refund is processed for the related artwork.
          Logs without a refund are retained indefinitely.
        </p>
      </div>

      {/* Logs Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Log ID</TableHead>
                  <TableHead className="text-zinc-400">Action</TableHead>
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead className="text-zinc-400">Artwork</TableHead>
                  <TableHead className="text-zinc-400">Details</TableHead>
                  <TableHead className="text-zinc-400">Expires</TableHead>
                  <TableHead className="text-zinc-400">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.log_id} className="border-zinc-800">
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {log.log_id}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadge(log.action)}>
                        {log.action?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-300">
                      {log.user_id ? `${log.user_id.slice(0, 12)}...` : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-300">
                      {log.artwork_id || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-xs text-zinc-500">
                        {JSON.stringify(log.details)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.expires_at ? (
                        <span className="text-yellow-500 text-xs">
                          {new Date(log.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-green-500 text-xs">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-zinc-500 text-sm mt-4">
        Showing {filteredLogs.length} of {logs.length} logs
      </p>
    </div>
  );
};

export default AdminAuditLogs;
