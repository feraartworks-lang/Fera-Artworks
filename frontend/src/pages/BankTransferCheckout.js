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
import { toast } from 'sonner';
import { 
  Building2, Copy, CheckCircle2, Clock, AlertCircle, 
  ArrowRight, Shield, Loader2, RefreshCw, XCircle,
  CreditCard, Banknote
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const BankTransferCheckout = () => {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  
  const [artwork, setArtwork] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [copied, setCopied] = useState({});
  const [checkingStatus, setCheckingStatus] = useState(false);

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
      const response = await axios.post(
        `${API}/payment/create-order`,
        { artwork_id: artworkId },
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
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
  };

  const formatIBAN = (iban) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                Secure Bank Transfer
              </h1>
              <p className="text-muted-foreground">
                Pay directly via bank transfer - No cards, no intermediaries
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
                          <span className="text-muted-foreground">Artwork Price</span>
                          <span className="font-mono">€{artwork.price?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">License Protection Fee (5%)</span>
                          <span className="font-mono">€{(artwork.price * 0.05).toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary font-mono">
                            €{(artwork.price * 1.05).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment Instructions */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Bank Transfer Details
                  </CardTitle>
                  <CardDescription>
                    Transfer the exact amount with the reference code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!order ? (
                    <div className="text-center py-8">
                      <Banknote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-6">
                        Click below to generate your unique payment reference
                      </p>
                      <Button 
                        onClick={createPaymentOrder}
                        disabled={isCreatingOrder}
                        className="btn-primary"
                        size="lg"
                      >
                        {isCreatingOrder ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Order...</>
                        ) : (
                          <><CreditCard className="w-4 h-4 mr-2" /> Generate Payment Details</>
                        )}
                      </Button>
                    </div>
                  ) : order.status === 'DELIVERED' ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-green-500 mb-2">Payment Complete!</h3>
                      <p className="text-muted-foreground mb-4">
                        The artwork has been added to your collection.
                      </p>
                      <Button onClick={() => navigate('/dashboard')} className="btn-primary">
                        View My Collection
                      </Button>
                    </div>
                  ) : order.status === 'EXPIRED' ? (
                    <div className="text-center py-8">
                      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-red-500 mb-2">Order Expired</h3>
                      <p className="text-muted-foreground mb-4">
                        Payment was not received within 72 hours.
                      </p>
                      <Button onClick={() => setOrder(null)} className="btn-primary">
                        Create New Order
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Status Badge */}
                      <div className={`p-3 rounded-lg flex items-center gap-2 ${
                        order.status === 'PAYMENT_RECEIVED' 
                          ? 'bg-green-500/10 border border-green-500/30' 
                          : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}>
                        {order.status === 'PAYMENT_RECEIVED' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-green-500 font-medium">Payment Received - Awaiting Confirmation</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <span className="text-yellow-500 font-medium">Awaiting Payment</span>
                          </>
                        )}
                      </div>

                      {/* Reference Code - CRITICAL */}
                      <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Payment Reference (REQUIRED)</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(order.reference, 'reference')}
                          >
                            {copied.reference ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="font-mono text-xl font-bold text-primary">{order.reference}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Include this EXACT reference in your transfer description
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Amount to Transfer</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(order.total_amount.toFixed(2), 'amount')}
                          >
                            {copied.amount ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="font-mono text-2xl font-bold">€{order.total_amount.toFixed(2)}</p>
                      </div>

                      {/* Bank Details */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Bank Account Details</h4>
                        
                        <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-xs text-muted-foreground">Account Holder</span>
                            <p className="font-medium">{order.bank_details?.account_holder}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(order.bank_details?.account_holder, 'holder')}
                          >
                            {copied.holder ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-xs text-muted-foreground">IBAN</span>
                            <p className="font-mono text-sm">{formatIBAN(order.bank_details?.iban || '')}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(order.bank_details?.iban?.replace(/\s/g, ''), 'iban')}
                          >
                            {copied.iban ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-xs text-muted-foreground">Bank / SWIFT</span>
                            <p className="font-medium">{order.bank_details?.bank_name} ({order.bank_details?.swift_bic})</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(order.bank_details?.swift_bic, 'swift')}
                          >
                            {copied.swift ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={checkPaymentStatus}
                          disabled={checkingStatus}
                          className="flex-1 btn-primary"
                        >
                          {checkingStatus ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                          ) : (
                            <><RefreshCw className="w-4 h-4 mr-2" /> Check Status</>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={cancelOrder}
                          className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                        >
                          Cancel
                        </Button>
                      </div>

                      {/* Info */}
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                        <p className="text-blue-400">
                          <Shield className="w-4 h-4 inline mr-1" />
                          Payment typically detected within 1-24 hours. 
                          Order expires in 72 hours if payment not received.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Why Bank Transfer */}
            <Card className="card-glass mt-8">
              <CardHeader>
                <CardTitle className="font-serif">Why Bank Transfer?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h4 className="font-medium mb-2">No Chargebacks</h4>
                    <p className="text-sm text-muted-foreground">
                      Bank transfers are final and irreversible, protecting both buyer and seller.
                    </p>
                  </div>
                  <div className="text-center">
                    <Banknote className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h4 className="font-medium mb-2">High-Value Ready</h4>
                    <p className="text-sm text-muted-foreground">
                      No transaction limits. Perfect for premium artwork purchases.
                    </p>
                  </div>
                  <div className="text-center">
                    <Building2 className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Direct & Transparent</h4>
                    <p className="text-sm text-muted-foreground">
                      No middlemen fees. Your payment goes directly to the platform.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BankTransferCheckout;
