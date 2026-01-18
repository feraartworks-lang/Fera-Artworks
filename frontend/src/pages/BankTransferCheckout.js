import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Building2, Copy, CheckCircle2, Clock, AlertCircle, 
  Shield, Loader2, RefreshCw, XCircle, Wallet, Coins
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const PaymentCheckout = () => {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [artwork, setArtwork] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [copied, setCopied] = useState({});
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [cryptoNetwork, setCryptoNetwork] = useState('trc20');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/checkout/${artworkId}` } } });
      return;
    }
    fetchArtwork();
  }, [artworkId, isAuthenticated]);

  const fetchArtwork = async () => {
    try {
      const response = await axios.get(`${API}/artworks/${artworkId}`);
      setArtwork(response.data);
    } catch (error) {
      toast.error('Artwork not found');
      navigate('/gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const payload = {
        artwork_id: artworkId,
        payment_method: paymentMethod
      };
      if (paymentMethod === 'usdt') {
        payload.crypto_network = cryptoNetwork;
      }
      
      const response = await axios.post(
        `${API}/payment/create-order`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder(response.data);
      toast.success('Payment order created');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!order) return;
    setCheckingStatus(true);
    try {
      const response = await axios.get(
        `${API}/payment/order/${order.order_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder(prev => ({ ...prev, ...response.data }));
      
      if (response.data.status === 'DELIVERED') {
        toast.success('Payment confirmed! Artwork is now yours.');
        navigate('/dashboard');
      } else if (response.data.status === 'PAYMENT_RECEIVED') {
        toast.success('Payment received! Awaiting confirmation.');
      } else if (response.data.status === 'EXPIRED') {
        toast.error('Order expired');
      }
    } catch (error) {
      toast.error('Failed to check status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    try {
      await axios.post(
        `${API}/payment/cancel-order/${order.order_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order cancelled');
      setOrder(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel');
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    toast.success('Copied!');
    setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
  };

  const formatIBAN = (iban) => iban?.replace(/(.{4})/g, '$1 ').trim() || '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalAmount = artwork ? artwork.price * 1.05 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                Secure Payment
              </h1>
              <p className="text-muted-foreground">
                Choose your preferred payment method
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Artwork Summary */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="font-serif">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {artwork && (
                    <>
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={artwork.image_url || '/placeholder-art.jpg'} 
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold">{artwork.title}</h3>
                        <p className="text-muted-foreground">{artwork.artist_name}</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-mono">
                            {paymentMethod === 'usdt' ? `$${artwork.price?.toFixed(2)}` : `€${artwork.price?.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">License Fee (5%)</span>
                          <span className="font-mono">
                            {paymentMethod === 'usdt' ? `$${(artwork.price * 0.05).toFixed(2)}` : `€${(artwork.price * 0.05).toFixed(2)}`}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary font-mono">
                            {paymentMethod === 'usdt' ? `$${totalAmount.toFixed(2)} USDT` : `€${totalAmount.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment Options */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="font-serif">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  {!order ? (
                    <div className="space-y-6">
                      <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="bank_transfer" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Bank Transfer
                          </TabsTrigger>
                          <TabsTrigger value="usdt" className="flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            USDT
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="bank_transfer" className="mt-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">
                              Pay via SEPA/SWIFT bank transfer in EUR
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li>• No transaction limits</li>
                              <li>• 1-24 hour confirmation</li>
                              <li>• Irreversible payment</li>
                            </ul>
                          </div>
                        </TabsContent>

                        <TabsContent value="usdt" className="mt-4 space-y-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">
                              Pay with USDT stablecoin
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li>• Fast blockchain confirmation</li>
                              <li>• Multiple networks supported</li>
                              <li>• Irreversible payment</li>
                            </ul>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Select Network</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'trc20', name: 'TRC-20', sub: 'Tron' },
                                { id: 'erc20', name: 'ERC-20', sub: 'Ethereum' },
                                { id: 'bep20', name: 'BEP-20', sub: 'BSC' }
                              ].map(net => (
                                <button
                                  key={net.id}
                                  onClick={() => setCryptoNetwork(net.id)}
                                  className={`p-3 rounded-lg border text-center transition-all ${
                                    cryptoNetwork === net.id 
                                      ? 'border-primary bg-primary/10' 
                                      : 'border-muted hover:border-primary/50'
                                  }`}
                                >
                                  <p className="font-medium text-sm">{net.name}</p>
                                  <p className="text-xs text-muted-foreground">{net.sub}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <Button 
                        onClick={createPaymentOrder}
                        disabled={isCreatingOrder}
                        className="w-full btn-primary h-12"
                      >
                        {isCreatingOrder ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Order...</>
                        ) : (
                          <>
                            {paymentMethod === 'usdt' ? <Coins className="w-4 h-4 mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
                            Continue with {paymentMethod === 'usdt' ? 'USDT' : 'Bank Transfer'}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : order.status === 'DELIVERED' ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-green-500 mb-2">Payment Complete!</h3>
                      <Button onClick={() => navigate('/dashboard')} className="btn-primary">
                        View My Collection
                      </Button>
                    </div>
                  ) : order.status === 'EXPIRED' ? (
                    <div className="text-center py-8">
                      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-red-500 mb-2">Order Expired</h3>
                      <Button onClick={() => setOrder(null)} className="btn-primary">
                        Create New Order
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Status */}
                      <div className={`p-3 rounded-lg flex items-center gap-2 ${
                        order.status === 'PAYMENT_RECEIVED' 
                          ? 'bg-green-500/10 border border-green-500/30' 
                          : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}>
                        {order.status === 'PAYMENT_RECEIVED' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-green-500 font-medium">Payment Received</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <span className="text-yellow-500 font-medium">Awaiting Payment</span>
                          </>
                        )}
                      </div>

                      {/* Reference Code */}
                      <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {order.payment_method === 'usdt' ? 'MEMO/NOTE (Required)' : 'Reference Code (Required)'}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.reference, 'ref')}>
                            {copied.ref ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="font-mono text-lg font-bold text-primary">{order.reference}</p>
                      </div>

                      {/* Amount */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Amount</span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.total_amount.toFixed(2), 'amt')}>
                            {copied.amt ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="font-mono text-2xl font-bold">
                          {order.currency === 'USDT' ? '$' : '€'}{order.total_amount.toFixed(2)} {order.currency}
                        </p>
                      </div>

                      {/* Payment Details */}
                      {order.payment_method === 'usdt' ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-500 text-sm font-medium flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Send on {order.payment_details?.network} network ONLY!
                            </p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs text-muted-foreground">USDT Wallet Address</span>
                                <p className="font-mono text-sm break-all">{order.payment_details?.address}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.payment_details?.address, 'addr')}>
                                {copied.addr ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                            <div>
                              <span className="text-xs text-muted-foreground">IBAN</span>
                              <p className="font-mono text-sm">{formatIBAN(order.payment_details?.iban)}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.payment_details?.iban?.replace(/\s/g, ''), 'iban')}>
                              {copied.iban ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs text-muted-foreground">Bank / SWIFT</span>
                            <p className="text-sm">{order.payment_details?.bank_name} ({order.payment_details?.swift_bic})</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs text-muted-foreground">Account Holder</span>
                            <p className="text-sm">{order.payment_details?.account_holder}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <Button onClick={checkPaymentStatus} disabled={checkingStatus} className="flex-1 btn-primary">
                          {checkingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-2" /> Check Status</>}
                        </Button>
                        <Button variant="outline" onClick={cancelOrder} className="text-red-500 border-red-500/50">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Card className="card-glass p-4 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">No Chargebacks</h4>
                <p className="text-xs text-muted-foreground">Payments are final and irreversible</p>
              </Card>
              <Card className="card-glass p-4 text-center">
                <Wallet className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">High-Value Ready</h4>
                <p className="text-xs text-muted-foreground">No transaction limits</p>
              </Card>
              <Card className="card-glass p-4 text-center">
                <Coins className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Multi-Currency</h4>
                <p className="text-xs text-muted-foreground">EUR or USDT accepted</p>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentCheckout;
