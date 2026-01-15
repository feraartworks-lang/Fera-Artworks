import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Smartphone, Key, Loader2, CheckCircle2, XCircle, Copy, QrCode } from 'lucide-react';

const AdminSettings = () => {
  const { adminApi } = useAdmin();
  
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Setup dialog
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupPassword, setSetupPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Disable dialog
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const data = await adminApi('get', '/admin/2fa/status');
      setIs2FAEnabled(data.enabled);
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSetup = async () => {
    if (!setupPassword) {
      toast.error('Please enter your password');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data = await adminApi('post', '/admin/2fa/setup', { password: setupPassword });
      setQrCode(data.qr_code);
      setSecretKey(data.secret);
      setSetupStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start 2FA setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi('post', '/admin/2fa/verify-setup', { code: verificationCode });
      toast.success('2FA enabled successfully!');
      setIs2FAEnabled(true);
      resetSetupDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi('post', '/admin/2fa/disable', { code: disableCode });
      toast.success('2FA disabled');
      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      setDisableCode('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSetupDialog = () => {
    setShowSetupDialog(false);
    setSetupStep(1);
    setSetupPassword('');
    setQrCode('');
    setSecretKey('');
    setVerificationCode('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-white">Security Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your admin account security</p>
      </div>

      {/* 2FA Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${is2FAEnabled ? 'bg-green-500/10' : 'bg-zinc-800'}`}>
                <Shield className={`w-6 h-6 ${is2FAEnabled ? 'text-green-500' : 'text-zinc-500'}`} />
              </div>
              <div>
                <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
                <CardDescription className="text-zinc-400">
                  Add an extra layer of security to your admin account
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {is2FAEnabled ? (
                <span className="flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Enabled
                </span>
              ) : (
                <span className="flex items-center gap-2 text-zinc-500 text-sm">
                  <XCircle className="w-4 h-4" />
                  Disabled
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-zinc-800/50 rounded-lg mb-4">
            <p className="text-zinc-300 text-sm">
              {is2FAEnabled 
                ? 'Your account is protected with two-factor authentication. You will need to enter a code from your authenticator app when logging in.'
                : 'Protect your admin account by requiring a verification code from your authenticator app in addition to your password.'}
            </p>
          </div>
          
          {is2FAEnabled ? (
            <Button 
              variant="outline" 
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={() => setShowDisableDialog(true)}
            >
              Disable 2FA
            </Button>
          ) : (
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setShowSetupDialog(true)}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Enable 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recommended Apps */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Recommended Authenticator Apps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-white font-medium">Google Authenticator</p>
              <p className="text-zinc-500 text-sm">iOS & Android</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-white font-medium">Microsoft Authenticator</p>
              <p className="text-zinc-500 text-sm">iOS & Android</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-white font-medium">Authy</p>
              <p className="text-zinc-500 text-sm">iOS, Android & Desktop</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={(open) => !open && resetSetupDialog()}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {setupStep === 1 ? 'Confirm Password' : 'Set Up 2FA'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {setupStep === 1 
                ? 'Enter your password to continue'
                : 'Scan the QR code with your authenticator app'}
            </DialogDescription>
          </DialogHeader>
          
          {setupStep === 1 ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Current Password</Label>
                <Input
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="bg-black border-zinc-800"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
              
              {/* Manual Entry Key */}
              <div className="space-y-2">
                <Label className="text-zinc-400 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Manual Entry Key
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={secretKey}
                    readOnly
                    className="bg-black border-zinc-800 font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(secretKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Verification Code */}
              <div className="space-y-2">
                <Label className="text-zinc-400">Enter the 6-digit code from your app</Label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-black border-zinc-800 text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={resetSetupDialog}>
              Cancel
            </Button>
            {setupStep === 1 ? (
              <Button 
                onClick={handleStartSetup}
                disabled={isSubmitting || !setupPassword}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </Button>
            ) : (
              <Button 
                onClick={handleVerifySetup}
                disabled={isSubmitting || verificationCode.length !== 6}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable 2FA'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-red-500">Disable 2FA</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter your current 2FA code to disable two-factor authentication
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                Warning: Disabling 2FA will make your account less secure. 
                Only do this if you no longer have access to your authenticator app.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-400">Authentication Code</Label>
              <Input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-black border-zinc-800 text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDisable2FA}
              disabled={isSubmitting || disableCode.length !== 6}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;
