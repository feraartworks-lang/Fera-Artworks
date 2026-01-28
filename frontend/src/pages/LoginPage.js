import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Lock, Wallet, ArrowLeft, Loader2, Link2 } from 'lucide-react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

const LoginPage = () => {
  const { login, loginWithGoogle, loginWithWeb3, requestWeb3Nonce } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWeb3Loading, setIsWeb3Loading] = useState(false);
  const [isWalletConnectLoading, setIsWalletConnectLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleWeb3Login = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed');
      return;
    }

    setIsWeb3Loading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      // Request nonce
      const { nonce, message } = await requestWeb3Nonce(address);

      // Sign message
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Verify and login
      await loginWithWeb3(address, signature, nonce);
      toast.success('Wallet connected successfully!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Web3 login error:', error);
      toast.error(error.response?.data?.detail || 'Wallet connection failed');
    } finally {
      setIsWeb3Loading(false);
    }
  };

  const handleWalletConnectLogin = async () => {
    setIsWalletConnectLoading(true);

    try {
      // Initialize WalletConnect provider
      const wcProvider = await EthereumProvider.init({
        projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
        chains: [1], // Ethereum mainnet
        showQrModal: true,
        optionalChains: [137, 56, 42161], // Polygon, BSC, Arbitrum
        metadata: {
          name: 'Imperial Art Gallery',
          description: 'Digital Art Ownership Platform',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        }
      });

      // Connect and get accounts
      await wcProvider.connect();
      const accounts = wcProvider.accounts;
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Request nonce from backend
      const { nonce, message } = await requestWeb3Nonce(address);

      // Sign message with WalletConnect
      const signature = await wcProvider.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Verify and login
      await loginWithWeb3(address, signature, nonce);
      toast.success('WalletConnect connected successfully!');
      navigate(from, { replace: true });

      // Disconnect after successful login (we store the address in our system)
      await wcProvider.disconnect();
    } catch (error) {
      console.error('WalletConnect login error:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Connection rejected by user');
      } else {
        toast.error(error.response?.data?.detail || 'WalletConnect failed');
      }
    } finally {
      setIsWalletConnectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="login-page">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-glow opacity-50" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back link */}
        <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <Card className="card-glass" data-testid="login-card">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary mx-auto mb-4 flex items-center justify-center">
              <span className="font-serif font-bold text-primary-foreground text-xl">A</span>
            </div>
            <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Imperial Art Gallery account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 input-dark"
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 input-dark"
                    required
                    data-testid="password-input"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={isLoading}
                data-testid="login-submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>

            {/* Social Login Options */}
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="btn-secondary w-full"
                onClick={handleGoogleLogin}
                data-testid="google-login-btn"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="btn-secondary"
                  onClick={handleWeb3Login}
                  disabled={isWeb3Loading}
                  data-testid="web3-login-btn"
                >
                  {isWeb3Loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4 mr-2" />
                  )}
                  MetaMask
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-secondary"
                  onClick={handleWalletConnectLogin}
                  disabled={isWalletConnectLoading}
                  data-testid="walletconnect-login-btn"
                >
                  {isWalletConnectLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  WalletConnect
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline" data-testid="register-link">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
