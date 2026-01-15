import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Lock, Mail, Key, Loader2, AlertTriangle, Smartphone } from 'lucide-react';

const AdminLoginPage = () => {
  const { adminLogin, adminLoginWith2FA, isLoading } = useAdmin();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const result = await adminLogin(email, password, adminSecret);
      
      if (result.requires_2fa) {
        setRequires2FA(true);
        toast.info('Please enter your 2FA code');
        return;
      }
      
      toast.success('Admin authentication successful');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    }
  };

  const handle2FALogin = async (e) => {
    e.preventDefault();
    
    try {
      await adminLoginWith2FA(email, password, adminSecret, totpCode);
      toast.success('Admin authentication successful');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || '2FA verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" data-testid="admin-login-page">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.05)_0%,rgba(0,0,0,1)_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6 p-4 border border-red-500/30 bg-red-500/5 rounded">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider text-sm">Restricted Access</span>
          </div>
          <p className="text-red-400/80 text-xs">
            This area is restricted to the FOUNDER ADMIN only. 
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>

        <Card className="bg-zinc-950 border-zinc-800" data-testid="admin-login-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="font-serif text-2xl text-white">
              {requires2FA ? '2FA Verification' : 'Admin Access'}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {requires2FA ? 'Enter your authenticator code' : 'Founder authentication required'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!requires2FA ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="fera.artworks@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-black border-zinc-800 text-white"
                      required
                      data-testid="admin-email-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-400">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-black border-zinc-800 text-white"
                      required
                      data-testid="admin-password-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secret" className="text-zinc-400">Admin Secret Key</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input
                      id="secret"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="pl-10 bg-black border-zinc-800 text-white font-mono"
                      required
                      data-testid="admin-secret-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                  data-testid="admin-login-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Access Admin Panel
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handle2FALogin} className="space-y-4">
                <div className="p-4 bg-zinc-900 rounded-lg text-center">
                  <Smartphone className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totp" className="text-zinc-400">Authentication Code</Label>
                  <Input
                    id="totp"
                    type="text"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-black border-zinc-800 text-white text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    required
                    autoFocus
                    data-testid="admin-totp-input"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading || totpCode.length !== 6}
                  data-testid="admin-2fa-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-500"
                  onClick={() => {
                    setRequires2FA(false);
                    setTotpCode('');
                  }}
                >
                  Back to login
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-zinc-600">
              Session expires after 7 days of inactivity
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
