import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Lock, Wallet, ArrowLeft, Loader2, Link2, Crown, Gem } from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

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
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      const { nonce, message } = await requestWeb3Nonce(address);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

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
    if (!WALLETCONNECT_PROJECT_ID) {
      toast.error('WalletConnect is not configured');
      return;
    }

    setIsWalletConnectLoading(true);

    try {
      const provider = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [1],
        showQrModal: true,
        qrModalOptions: { themeMode: 'dark' },
        metadata: {
          name: 'Imperial Art Gallery',
          description: 'Digital Art Ownership Platform',
          url: window.location.origin,
          icons: ['https://avatars.githubusercontent.com/u/37784886']
        }
      });

      await provider.enable();
      
      const accounts = provider.accounts;
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const { nonce, message } = await requestWeb3Nonce(address);
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address]
      });

      await loginWithWeb3(address, signature, nonce);
      toast.success('WalletConnect connected successfully!');
      navigate(from, { replace: true });
      await provider.disconnect();
    } catch (error) {
      console.error('WalletConnect login error:', error);
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('WalletConnect failed. Please try again.');
      }
    } finally {
      setIsWalletConnectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex" data-testid="login-page">
      {/* Left Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&q=80)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/50 to-transparent" />
        <div className="absolute inset-0 bg-[#050505]/40" />
        
        {/* Decorative Elements */}
        <div className="absolute bottom-12 left-12 right-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-px bg-[#D4AF37]/50" />
            <Gem className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
          </div>
          <p className="font-serif text-3xl text-[#F5F5F0] leading-relaxed">
            "Art is not what you see, but what you make others see."
          </p>
          <p className="text-[#D4AF37] text-sm mt-4 tracking-wider">— Edgar Degas</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Back link */}
          <Link 
            to="/" 
            className="inline-flex items-center text-[#525252] hover:text-[#D4AF37] mb-12 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#F5F5F0] mb-2">Welcome Back</h1>
            <p className="text-[#525252] text-sm">Sign in to your Imperial Art Gallery account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-6" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.5} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-transparent border-[#333] focus:border-[#D4AF37] text-[#F5F5F0] placeholder:text-[#444]"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.5} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-transparent border-[#333] focus:border-[#D4AF37] text-[#F5F5F0] placeholder:text-[#444]"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-gold h-14"
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

          {/* Divider */}
          <div className="relative my-8">
            <Separator className="bg-[#333]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-4 text-xs text-[#525252] uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-12 btn-outline-gold"
              onClick={handleGoogleLogin}
              data-testid="google-login-btn"
            >
              <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button"
                variant="outline" 
                className="h-12 btn-outline-gold"
                onClick={handleWeb3Login}
                disabled={isWeb3Loading}
                data-testid="web3-login-btn"
              >
                {isWeb3Loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    MetaMask
                  </>
                )}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                className="h-12 btn-outline-gold"
                onClick={handleWalletConnectLogin}
                disabled={isWalletConnectLoading}
                data-testid="walletconnect-login-btn"
              >
                {isWalletConnectLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    WalletConnect
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-[#525252] mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#D4AF37] hover:underline" data-testid="register-link">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
