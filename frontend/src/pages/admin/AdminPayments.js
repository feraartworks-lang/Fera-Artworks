import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Building2, CheckCircle2, Clock, XCircle, Search, Loader2, 
  RefreshCw, Eye, CreditCard, AlertCircle, Plus, DollarSign
} from 'lucide-react';

const AdminPayments = () => {
  const { adminApi } = useAdmin();
  
  const [orders, setOrders] = useState([]);
  const [unmatchedTx, setUnmatchedTx] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTx, setNewTx] = useState({
    transaction_id: '',
    amount: '',
    currency: 'EUR',
    sender_name: '',
    sender_iban: '',
    reference: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, unmatchedRes] = await Promise.all([
        adminApi('get', statusFilter === 'all' 
          ? '/admin/payment/all-orders' 
          : `/admin/payment/all-orders?status=${statusFilter}`),
        adminApi('get', '/admin/payment/unmatched-transactions')
      ]);
      setOrders(ordersRes);
      setUnmatchedTx(unmatchedRes);
    } catch (error) {
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordTransaction = async () => {
    if (!newTx.transaction_id || !newTx.amount || !newTx.reference) {
      toast.error('Please fill required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await adminApi('post', '/admin/payment/record-transaction', {
        ...newTx,
        amount: parseFloat(newTx.amount),
        transaction_date: new Date(newTx.transaction_date).toISOString()
      });
      
      if (result.match_result?.matched) {
        toast.success(`Payment matched to order ${result.match_result.order_id}`);
      } else {
        toast.warning(`Payment recorded but not matched: ${result.match_result?.reason}`);
      }
      
      setShowRecordDialog(false);
      setNewTx({
        transaction_id: '',
        amount: '',
        currency: 'EUR',
        sender_name: '',
        sender_iban: '',
        reference: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      await adminApi('post', `/admin/payment/confirm-order/${selectedOrder.order_id}`);
      toast.success('Order confirmed and artwork delivered');
      setShowConfirmDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder || !refundReason) return;
    setIsSubmitting(true);
    try {
      const result = await adminApi('post', '/admin/payment/refund', {
        order_id: selectedOrder.order_id,
        reason: refundReason
      });
      toast.success(`Refund initiated: €${result.refund_amount}`);
      setShowRefundDialog(false);
      setRefundReason('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING_PAYMENT': 'bg-yellow-500/20 text-yellow-500',
      'PAYMENT_RECEIVED': 'bg-blue-500/20 text-blue-500',
      'CONFIRMED': 'bg-green-500/20 text-green-500',
      'DELIVERED': 'bg-green-500/20 text-green-500',
      'CANCELLED': 'bg-zinc-500/20 text-zinc-500',
      'EXPIRED': 'bg-red-500/20 text-red-500',
      'REFUNDED': 'bg-purple-500/20 text-purple-500'
    };
    return <Badge className={styles[status] || 'bg-zinc-500/20'}>{status}</Badge>;
  };

  const filteredOrders = orders.filter(order => 
    order.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.artwork_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">A2A Payments</h1>
          <p className="text-zinc-400 mt-1">Bank transfer payment management</p>
        </div>
        <Button onClick={() => setShowRecordDialog(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Record Transaction
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-zinc-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {orders.filter(o => o.status === 'PENDING_PAYMENT').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-zinc-400 text-sm">Received</p>
                <p className="text-2xl font-bold text-white">
                  {orders.filter(o => o.status === 'PAYMENT_RECEIVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-zinc-400 text-sm">Delivered</p>
                <p className="text-2xl font-bold text-white">
                  {orders.filter(o => o.status === 'DELIVERED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-zinc-400 text-sm">Unmatched</p>
                <p className="text-2xl font-bold text-white">{unmatchedTx.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search by reference, email, or artwork..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-md px-4 text-white"
        >
          <option value="all">All Status</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PAYMENT_RECEIVED">Payment Received</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Orders Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Reference</TableHead>
              <TableHead className="text-zinc-400">Artwork</TableHead>
              <TableHead className="text-zinc-400">Buyer</TableHead>
              <TableHead className="text-zinc-400">Amount</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Created</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  No payment orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.order_id} className="border-zinc-800">
                  <TableCell className="font-mono text-primary">{order.reference}</TableCell>
                  <TableCell className="text-white">{order.artwork_title}</TableCell>
                  <TableCell className="text-zinc-400">{order.buyer_email}</TableCell>
                  <TableCell className="font-mono text-green-500">€{order.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-zinc-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_RECEIVED') && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => { setSelectedOrder(order); setShowConfirmDialog(true); }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {order.status === 'DELIVERED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-500"
                          onClick={() => { setSelectedOrder(order); setShowRefundDialog(true); }}
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Record Transaction Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Record Bank Transaction
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter the bank transaction details to match with pending orders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction ID *</Label>
                <Input
                  value={newTx.transaction_id}
                  onChange={(e) => setNewTx({...newTx, transaction_id: e.target.value})}
                  className="bg-black border-zinc-800"
                  placeholder="Bank reference"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTx.amount}
                  onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                  className="bg-black border-zinc-800"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Reference * (from transfer description)</Label>
              <Input
                value={newTx.reference}
                onChange={(e) => setNewTx({...newTx, reference: e.target.value})}
                className="bg-black border-zinc-800 font-mono"
                placeholder="IAG-2026-XXXXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sender Name</Label>
                <Input
                  value={newTx.sender_name}
                  onChange={(e) => setNewTx({...newTx, sender_name: e.target.value})}
                  className="bg-black border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Transaction Date</Label>
                <Input
                  type="date"
                  value={newTx.transaction_date}
                  onChange={(e) => setNewTx({...newTx, transaction_date: e.target.value})}
                  className="bg-black border-zinc-800"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordTransaction} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record & Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Order Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Payment & Deliver</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This will transfer artwork ownership to the buyer
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="py-4 space-y-3">
              <p><strong>Reference:</strong> {selectedOrder.reference}</p>
              <p><strong>Artwork:</strong> {selectedOrder.artwork_title}</p>
              <p><strong>Buyer:</strong> {selectedOrder.buyer_email}</p>
              <p><strong>Amount:</strong> €{selectedOrder.total_amount?.toFixed(2)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmOrder} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Deliver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Process Refund</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Refunds are seller-controlled. License fee (5%) is non-refundable.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-zinc-800 rounded">
                <p className="text-sm text-zinc-400">Refund Amount</p>
                <p className="text-xl font-mono">€{selectedOrder.artwork_price?.toFixed(2)}</p>
                <p className="text-xs text-zinc-500">License fee of €{selectedOrder.license_fee?.toFixed(2)} is non-refundable</p>
              </div>
              <div className="space-y-2">
                <Label>Reason for refund *</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="bg-black border-zinc-800"
                  placeholder="Enter reason..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
            <Button onClick={handleRefund} disabled={isSubmitting || !refundReason} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
