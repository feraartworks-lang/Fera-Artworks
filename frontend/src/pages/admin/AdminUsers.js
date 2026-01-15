import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Search, Ban, UserCheck, Clock, Loader2, User, Wallet,
  Mail, Calendar, DollarSign, Shield
} from 'lucide-react';

const AdminUsers = () => {
  const { adminApi } = useAdmin();
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [suspendDays, setSuspendDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminApi('get', '/admin/users');
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!actionReason && (actionType === 'ban' || actionType === 'suspend')) {
      toast.error('Please provide a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi('post', '/admin/users/action', {
        user_id: selectedUser.user_id,
        action: actionType,
        reason: actionReason,
        duration_days: actionType === 'suspend' ? parseInt(suspendDays) : null
      });
      toast.success(`User ${actionType} successful`);
      setShowActionDialog(false);
      resetDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${actionType} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setSelectedUser(null);
    setActionType('');
    setActionReason('');
    setSuspendDays('7');
  };

  const openActionDialog = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionDialog(true);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id?.includes(searchTerm)
  );

  const getStatusBadge = (user) => {
    if (user.is_founder_admin) return <Badge className="bg-red-500">Founder Admin</Badge>;
    if (user.status === 'banned') return <Badge className="bg-red-500">Banned</Badge>;
    if (user.status === 'suspended') return <Badge className="bg-yellow-500">Suspended</Badge>;
    return <Badge className="bg-green-500">Active</Badge>;
  };

  return (
    <div data-testid="admin-users">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-white">Users</h1>
        <p className="text-zinc-500">Manage user accounts and permissions</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          data-testid="search-users"
        />
      </div>

      {/* Users Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400">Auth Type</TableHead>
                  <TableHead className="text-zinc-400">Balance</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id} className="border-zinc-800" data-testid={`user-row-${user.user_id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                          {user.picture ? (
                            <img src={user.picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium flex items-center gap-2">
                            {user.name}
                            {user.is_founder_admin && <Shield className="w-4 h-4 text-red-500" />}
                          </p>
                          <p className="text-zinc-500 text-xs font-mono">{user.user_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-zinc-400 capitalize">
                        {user.auth_type || 'email'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-green-500">
                      ${(user.balance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!user.is_founder_admin && (
                        <div className="flex justify-end gap-2">
                          {user.status === 'banned' ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openActionDialog(user, 'unban')}
                              className="text-green-500 hover:bg-green-500/10"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Unban
                            </Button>
                          ) : user.status === 'suspended' ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openActionDialog(user, 'unsuspend')}
                              className="text-green-500 hover:bg-green-500/10"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Unsuspend
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openActionDialog(user, 'suspend')}
                                className="text-yellow-500 hover:bg-yellow-500/10"
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Suspend
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openActionDialog(user, 'ban')}
                                className="text-red-500 hover:bg-red-500/10"
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Ban
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-zinc-500 text-sm mt-4">
        Total: {filteredUsers.length} users
      </p>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl capitalize">
              {actionType} User
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {actionType === 'ban' && 'This will permanently block the user from accessing the platform.'}
              {actionType === 'suspend' && 'This will temporarily block the user for the specified duration.'}
              {actionType === 'unban' && 'This will restore the user\'s access to the platform.'}
              {actionType === 'unsuspend' && 'This will remove the suspension and restore access.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-3 bg-zinc-800 rounded">
              <p className="text-white font-medium">{selectedUser?.name}</p>
              <p className="text-zinc-400 text-sm">{selectedUser?.email}</p>
            </div>

            {(actionType === 'ban' || actionType === 'suspend') && (
              <>
                {actionType === 'suspend' && (
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Suspension Duration</Label>
                    <Select value={suspendDays} onValueChange={setSuspendDays}>
                      <SelectTrigger className="bg-black border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-zinc-400">Reason *</Label>
                  <Textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="bg-black border-zinc-800 min-h-[100px]"
                    placeholder="Provide a reason for this action..."
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowActionDialog(false); resetDialog(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUserAction}
              disabled={isSubmitting}
              className={
                actionType === 'ban' ? 'bg-red-600 hover:bg-red-700' :
                actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-green-600 hover:bg-green-700'
              }
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `${actionType} User`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
