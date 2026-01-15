import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Search, Loader2, RefreshCw, ArrowRightLeft, DollarSign,
  ShoppingCart, TrendingUp, CreditCard, Clock
} from 'lucide-react';

const AdminTransactions = () => {
  const { adminApi } = useAdmin();
  
  const [transactions, setTransactions] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Manual operation dialogs
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [refundData, setRefundData] = useState({ artwork_id: '', user_id: '', reason: '' });
  const [transferData, setTransferData] = useState({ artwork_id: '', from_user_id: '', to_user_id: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txData, artData, userData] = await Promise.all([
        adminApi('get', '/admin/transactions'),
        adminApi('get', '/admin/artworks'),
        adminApi('get', '/admin/users')
      ]);
      setTransactions(txData);
      setArtworks(artData);
      setUsers(userData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefund = async () => {
    if (!refundData.artwork_id || !refundData.user_id || !refundData.reason) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adminApi('post', '/admin/manual-refund', refundData);
      toast.success(`Refund processed: $${result.amount}`);
      setShowRefundDialog(false);
      setRefundData({ artwork_id: '', user_id: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Refund failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualTransfer = async () => {
    if (!transferData.artwork_id || !transferData.from_user_id || !transferData.to_user_id || !transferData.reason) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi('post', '/admin/manual-transfer', transferData);
      toast.success('Transfer completed successfully');
      setShowTransferDialog(false);
      setTransferData({ artwork_id: '', from_user_id: '', to_user_id: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'p2p_sale': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'refund':
      case 'manual_refund': return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      case 'withdrawal': return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'manual_transfer': return <ArrowRightLeft className="w-4 h-4 text-cyan-500" />;
      default: return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  const ownedArtworks = artworks.filter(a => a.is_purchased && !a.is_refunded);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.transaction_id?.includes(searchTerm) ||
      tx.user_id?.includes(searchTerm) ||
      tx.artwork_id?.includes(searchTerm);
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div data-testid="admin-transactions">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Transactions</h1>
          <p className="text-zinc-500">View and manage all platform transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowRefundDialog(true)}
            variant="outline"
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
            data-testid="manual-refund-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Manual Refund
          </Button>
          <Button 
            onClick={() => setShowTransferDialog(true)}
            variant="outline"
            className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
            data-testid="manual-transfer-btn"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Manual Transfer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search by transaction ID, user ID, or artwork ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 bg-zinc-900 border-zinc-800 text-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="p2p_sale">P2P Sale</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="manual_refund">Manual Refund</SelectItem>
            <SelectItem value="manual_transfer">Manual Transfer</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
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
                  <TableHead className="text-zinc-400">Transaction</TableHead>
                  <TableHead className="text-zinc-400">Type</TableHead>
                  <TableHead className="text-zinc-400">Amount</TableHead>
                  <TableHead className="text-zinc-400">Fee</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.transaction_id} className="border-zinc-800">
                    <TableCell>
                      <p className="font-mono text-white text-sm">{tx.transaction_id}</p>
                      {tx.artwork_id && (
                        <p className="text-zinc-500 text-xs">Artwork: {tx.artwork_id}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="text-white capitalize">{tx.type?.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-green-500">
                      ${(tx.amount || tx.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-zinc-400">
                      ${(tx.fee || tx.commission || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        tx.status === 'completed' ? 'bg-green-500' :
                        tx.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-zinc-500 text-sm mt-4">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </p>

      {/* Manual Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Manual Refund</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Process a manual refund for an artwork. This bypasses normal refund restrictions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Artwork</Label>
              <Select value={refundData.artwork_id} onValueChange={(v) => {
                const art = ownedArtworks.find(a => a.artwork_id === v);
                setRefundData({...refundData, artwork_id: v, user_id: art?.owner_id || ''});
              }}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select artwork" />
                </SelectTrigger>
                <SelectContent>
                  {ownedArtworks.map(art => (
                    <SelectItem key={art.artwork_id} value={art.artwork_id}>
                      {art.title} (${art.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Owner User ID</Label>
              <Input
                value={refundData.user_id}
                onChange={(e) => setRefundData({...refundData, user_id: e.target.value})}
                className="bg-black border-zinc-800 font-mono"
                placeholder="user_xxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Reason *</Label>
              <Textarea
                value={refundData.reason}
                onChange={(e) => setRefundData({...refundData, reason: e.target.value})}
                className="bg-black border-zinc-800 min-h-[100px]"
                placeholder="Reason for manual refund..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleManualRefund}
              disabled={isSubmitting}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Manual Transfer</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Transfer artwork ownership between users. This bypasses marketplace.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Artwork</Label>
              <Select value={transferData.artwork_id} onValueChange={(v) => {
                const art = ownedArtworks.find(a => a.artwork_id === v);
                setTransferData({...transferData, artwork_id: v, from_user_id: art?.owner_id || ''});
              }}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select artwork" />
                </SelectTrigger>
                <SelectContent>
                  {ownedArtworks.map(art => (
                    <SelectItem key={art.artwork_id} value={art.artwork_id}>
                      {art.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">From User ID</Label>
              <Input
                value={transferData.from_user_id}
                onChange={(e) => setTransferData({...transferData, from_user_id: e.target.value})}
                className="bg-black border-zinc-800 font-mono"
                placeholder="user_xxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">To User</Label>
              <Select value={transferData.to_user_id} onValueChange={(v) => setTransferData({...transferData, to_user_id: v})}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select target user" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.user_id !== transferData.from_user_id).map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Reason *</Label>
              <Textarea
                value={transferData.reason}
                onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                className="bg-black border-zinc-800 min-h-[100px]"
                placeholder="Reason for manual transfer..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleManualTransfer}
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transfer Ownership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactions;
