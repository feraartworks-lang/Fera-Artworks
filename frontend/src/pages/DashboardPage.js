import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { 
  Image, Wallet, ArrowUpRight, ArrowDownLeft, Clock, 
  DollarSign, RefreshCw, Eye, Download, Loader2, 
  CreditCard, ExternalLink, Copy, Settings, Building2, Save
} from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const { user, token, updateUser, connectWallet } = useAuth();
  const navigate = useNavigate();

  const [artworks, setArtworks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  
  // Bank info state
  const [bankInfo, setBankInfo] = useState({
    iban: '',
    bank_name: '',
    account_holder_name: '',
    swift_bic: ''
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artworksRes, transactionsRes, listingsRes, bankRes] = await Promise.all([
          axios.get(`${API}/user/artworks`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/user/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/user/listings`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/user/bank-info`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setArtworks(artworksRes.data);
        setTransactions(transactionsRes.data);
        setListings(listingsRes.data);
        setBankInfo({
          iban: bankRes.data.iban || '',
          bank_name: bankRes.data.bank_name || '',
          account_holder_name: bankRes.data.account_holder_name || '',
          swift_bic: bankRes.data.swift_bic || ''
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed');
      return;
    }

    setIsConnectingWallet(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      await connectWallet(address);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > (user?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }
    if (!withdrawDestination) {
      toast.error('Please enter a destination');
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await axios.post(
        `${API}/withdraw`,
        { 
          amount, 
          method: user?.wallet_address ? 'crypto' : 'bank',
          destination: withdrawDestination 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Withdrawal initiated! Net amount: $${response.data.net_amount.toFixed(2)}`);
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setWithdrawDestination('');
      updateUser({ balance: (user?.balance || 0) - amount });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSaveBankInfo = async () => {
    setIsSavingBank(true);
    try {
      await axios.put(
        `${API}/user/bank-info`,
        bankInfo,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Bank information saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save bank information');
    } finally {
      setIsSavingBank(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <ArrowDownLeft className="w-4 h-4 text-neon-green" />;
      case 'p2p_sale':
        return <ArrowUpRight className="w-4 h-4 text-secondary" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-primary" />;
      case 'withdrawal':
        return <CreditCard className="w-4 h-4 text-neon-purple" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                Welcome, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground">Manage your digital art collection</p>
            </div>
            <div className="flex gap-4">
              {!user?.wallet_address ? (
                <Button 
                  variant="outline"
                  onClick={handleConnectWallet}
                  disabled={isConnectingWallet}
                  data-testid="connect-wallet-btn"
                >
                  {isConnectingWallet ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4 mr-2" />
                  )}
                  Connect Wallet
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(user.wallet_address)}
                  data-testid="wallet-address-btn"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                  <Copy className="w-3 h-3 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="card-glass" data-testid="stats-balance">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Balance</p>
                      <p className="font-mono text-2xl text-primary">${(user?.balance || 0).toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary/50" />
                  </div>
                  {(user?.balance || 0) > 0 && (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs text-primary"
                      onClick={() => setShowWithdrawDialog(true)}
                    >
                      Withdraw Funds
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="card-glass" data-testid="stats-artworks">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Owned Artworks</p>
                      <p className="font-mono text-2xl text-foreground">{artworks.length}</p>
                    </div>
                    <Image className="w-8 h-8 text-secondary/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="card-glass" data-testid="stats-listings">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Active Listings</p>
                      <p className="font-mono text-2xl text-foreground">
                        {listings.filter(l => l.status === 'active').length}
                      </p>
                    </div>
                    <ArrowUpRight className="w-8 h-8 text-neon-green/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="card-glass" data-testid="stats-transactions">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Transactions</p>
                      <p className="font-mono text-2xl text-foreground">{transactions.length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-accent/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="collection" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="collection" data-testid="tab-collection">
                <Image className="w-4 h-4 mr-2" />
                Collection
              </TabsTrigger>
              <TabsTrigger value="transactions" data-testid="tab-transactions">
                <Clock className="w-4 h-4 mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="listings" data-testid="tab-listings">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                My Listings
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Collection Tab */}
            <TabsContent value="collection">
              {artworks.length === 0 ? (
                <Card className="card-glass">
                  <CardContent className="p-12 text-center">
                    <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl text-foreground mb-2">No artworks yet</h3>
                    <p className="text-muted-foreground mb-4">Start building your collection today!</p>
                    <Link to="/gallery">
                      <Button className="btn-primary">
                        Browse Gallery
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {artworks.map((artwork, index) => (
                    <motion.div
                      key={artwork.artwork_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="card-interactive overflow-hidden group" data-testid={`owned-artwork-${index}`}>
                        <div className="aspect-square overflow-hidden relative">
                          <img 
                            src={artwork.preview_url} 
                            alt={artwork.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            {artwork.is_used && (
                              <Badge className="bg-neon-purple">
                                <Download className="w-3 h-3 mr-1" />
                                Downloaded
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif text-lg font-bold text-foreground truncate">
                            {artwork.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">{artwork.artist_name}</p>
                          {artwork.license_id && (
                            <p className="text-xs text-primary font-mono mt-1 truncate" title={artwork.license_id}>
                              {artwork.license_id}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            {!artwork.is_used && (
                              <Link to={`/secure-view/${artwork.artwork_id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </Link>
                            )}
                            <Link to={`/artwork/${artwork.artwork_id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              {transactions.length === 0 ? (
                <Card className="card-glass">
                  <CardContent className="p-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl text-foreground mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground">Your transaction history will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-glass">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {transactions.map((tx, index) => (
                        <div 
                          key={tx.transaction_id} 
                          className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                          data-testid={`transaction-${index}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              {getTransactionIcon(tx.type)}
                            </div>
                            <div>
                              <p className="text-foreground font-medium capitalize">
                                {tx.type.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {tx.transaction_id}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-mono ${
                              tx.type === 'p2p_sale' || tx.type === 'refund' 
                                ? 'text-neon-green' 
                                : 'text-foreground'
                            }`}>
                              {tx.type === 'p2p_sale' || tx.type === 'refund' ? '+' : '-'}
                              ${(tx.amount || tx.total || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Listings Tab */}
            <TabsContent value="listings">
              {listings.length === 0 ? (
                <Card className="card-glass">
                  <CardContent className="p-12 text-center">
                    <ArrowUpRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl text-foreground mb-2">No listings yet</h3>
                    <p className="text-muted-foreground mb-4">List your artworks for sale on the marketplace.</p>
                    <Link to="/marketplace">
                      <Button className="btn-primary">
                        Go to Marketplace
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {listings.map((listing, index) => (
                    <Card key={listing.listing_id} className="card-glass" data-testid={`listing-${index}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                              <img 
                                src={listing.artwork?.preview_url || ''} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-serif font-bold text-foreground">
                                {listing.artwork?.title || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground font-mono">
                                ${listing.sale_price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            className={
                              listing.status === 'active' 
                                ? 'bg-neon-green/20 text-neon-green' 
                                : listing.status === 'sold'
                                ? 'bg-secondary/20 text-secondary'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {listing.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Bank Information Card */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Bank Information
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add your bank details for withdrawals and refunds
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_holder">Account Holder Name</Label>
                      <Input
                        id="account_holder"
                        placeholder="Full name as on bank account"
                        value={bankInfo.account_holder_name}
                        onChange={(e) => setBankInfo({...bankInfo, account_holder_name: e.target.value})}
                        className="input-dark"
                        data-testid="input-account-holder"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        value={bankInfo.iban}
                        onChange={(e) => setBankInfo({...bankInfo, iban: e.target.value.toUpperCase()})}
                        className="input-dark font-mono"
                        data-testid="input-iban"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        placeholder="e.g., Ziraat Bankası"
                        value={bankInfo.bank_name}
                        onChange={(e) => setBankInfo({...bankInfo, bank_name: e.target.value})}
                        className="input-dark"
                        data-testid="input-bank-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swift_bic">SWIFT/BIC Code</Label>
                      <Input
                        id="swift_bic"
                        placeholder="e.g., TCZBTR2A"
                        value={bankInfo.swift_bic}
                        onChange={(e) => setBankInfo({...bankInfo, swift_bic: e.target.value.toUpperCase()})}
                        className="input-dark font-mono"
                        data-testid="input-swift"
                      />
                    </div>
                    <Button 
                      onClick={handleSaveBankInfo}
                      disabled={isSavingBank}
                      className="w-full btn-primary"
                      data-testid="save-bank-info-btn"
                    >
                      {isSavingBank ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" /> Save Bank Information</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Wallet Card */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-neon-purple" />
                      Crypto Wallet
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Connect your wallet for crypto payments and withdrawals
                    </p>
                  </CardHeader>
                  <CardContent>
                    {user?.wallet_address ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border border-neon-purple/30">
                          <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                          <p className="font-mono text-sm text-foreground break-all">
                            {user.wallet_address}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => copyToClipboard(user.wallet_address)}
                          className="w-full"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No wallet connected</p>
                        <Button 
                          onClick={handleConnectWallet}
                          disabled={isConnectingWallet}
                          className="btn-secondary"
                        >
                          {isConnectingWallet ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                          ) : (
                            <><Wallet className="w-4 h-4 mr-2" /> Connect MetaMask</>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Withdraw Funds</DialogTitle>
            <DialogDescription>
              Withdraw your earnings to your bank account or crypto wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="font-mono text-2xl text-primary">${(user?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="input-dark font-mono"
              />
              <p className="text-xs text-muted-foreground">
                1% withdrawal fee applies (Net: ${((parseFloat(withdrawAmount) || 0) * 0.99).toFixed(2)})
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">
                {user?.wallet_address ? 'Wallet Address' : 'Bank Account'}
              </Label>
              <Input
                id="destination"
                placeholder={user?.wallet_address ? '0x...' : 'Account number'}
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                className="input-dark font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="btn-primary"
              onClick={handleWithdraw}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                'Withdraw'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DashboardPage;
