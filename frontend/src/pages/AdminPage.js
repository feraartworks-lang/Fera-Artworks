import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import { 
  Shield, Users, Image, DollarSign, BarChart3, Clock, 
  Loader2, RefreshCw, TrendingUp, Download, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [statsRes, artworksRes, usersRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/artworks`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setArtworks(artworksRes.data);
      setUsers(usersRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (artwork) => {
    if (artwork.is_refunded) return <Badge variant="outline">Refunded</Badge>;
    if (artwork.is_used) return <Badge className="bg-neon-purple">Downloaded</Badge>;
    if (artwork.is_transferred) return <Badge className="bg-accent">Transferred</Badge>;
    if (artwork.is_purchased) return <Badge className="bg-secondary">Owned</Badge>;
    return <Badge variant="outline" className="text-neon-green">Available</Badge>;
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
    <div className="min-h-screen bg-background" data-testid="admin-page">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Platform management and analytics</p>
            </div>
            <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="card-glass" data-testid="stat-users">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Users</p>
                      <p className="font-mono text-3xl text-foreground">{stats?.total_users || 0}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="card-glass" data-testid="stat-artworks">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Artworks</p>
                      <p className="font-mono text-3xl text-foreground">{stats?.total_artworks || 0}</p>
                    </div>
                    <Image className="w-10 h-10 text-secondary/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="card-glass" data-testid="stat-transactions">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Transactions</p>
                      <p className="font-mono text-3xl text-foreground">{stats?.total_transactions || 0}</p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-neon-green/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="card-glass" data-testid="stat-listings">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Active Listings</p>
                      <p className="font-mono text-3xl text-foreground">{stats?.active_listings || 0}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-accent/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Transaction Breakdown */}
          {stats?.transaction_breakdown?.length > 0 && (
            <Card className="card-glass mb-8">
              <CardHeader>
                <CardTitle className="font-serif">Transaction Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.transaction_breakdown.map((item) => (
                    <div key={item._id} className="p-4 bg-muted/30 rounded">
                      <p className="text-muted-foreground text-sm capitalize">{item._id?.replace('_', ' ')}</p>
                      <p className="font-mono text-xl text-foreground">{item.count}</p>
                      <p className="font-mono text-sm text-primary">${item.total?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="artworks" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="artworks" data-testid="tab-artworks">
                <Image className="w-4 h-4 mr-2" />
                Artworks ({artworks.length})
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="w-4 h-4 mr-2" />
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="transactions" data-testid="tab-transactions">
                <Clock className="w-4 h-4 mr-2" />
                Transactions ({transactions.length})
              </TabsTrigger>
            </TabsList>

            {/* Artworks Tab */}
            <TabsContent value="artworks">
              <Card className="card-glass">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Artwork</TableHead>
                        <TableHead>Artist</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {artworks.map((artwork) => (
                        <TableRow key={artwork.artwork_id} data-testid={`artwork-row-${artwork.artwork_id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                                <img 
                                  src={artwork.preview_url} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{artwork.title}</p>
                                <p className="text-xs text-muted-foreground font-mono">{artwork.artwork_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{artwork.artist_name}</TableCell>
                          <TableCell className="font-mono">${artwork.price.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(artwork)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {artwork.owner_id ? `${artwork.owner_id.slice(0, 12)}...` : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(artwork.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="card-glass">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Auth Type</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.user_id} data-testid={`user-row-${user.user_id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {user.picture ? (
                                <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{user.user_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.auth_type || 'email'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-primary">
                            ${(user.balance || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {user.wallet_address ? `${user.wallet_address.slice(0, 8)}...` : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card className="card-glass">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 50).map((tx) => (
                        <TableRow key={tx.transaction_id} data-testid={`tx-row-${tx.transaction_id}`}>
                          <TableCell className="font-mono text-xs">{tx.transaction_id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {tx.type?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            ${(tx.amount || tx.total || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ${(tx.fee || tx.commission || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={tx.status === 'completed' 
                                ? 'bg-neon-green/20 text-neon-green' 
                                : 'bg-secondary/20 text-secondary'
                              }
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
