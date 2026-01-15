import React, { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Download, FileSpreadsheet, FileJson, Calendar, Loader2,
  TrendingUp, Users, Image as ImageIcon, DollarSign
} from 'lucide-react';

const AdminReports = () => {
  const { adminApi, adminToken } = useAdmin();
  
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState({ tx: false, users: false, artworks: false });

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate]);

  const fetchSummary = async () => {
    try {
      let endpoint = '/admin/reports/summary';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length) endpoint += `?${params.join('&')}`;
      
      const data = await adminApi('get', endpoint);
      setSummary(data);
    } catch (error) {
      toast.error('Failed to load report summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type) => {
    setIsExporting({ ...isExporting, [type]: true });
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/export/${type}?format=${exportFormat}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${type}`);
    } finally {
      setIsExporting({ ...isExporting, [type]: false });
    }
  };

  return (
    <div data-testid="admin-reports">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-white">Reports & Export</h1>
        <p className="text-zinc-500">Generate reports and export platform data</p>
      </div>

      {/* Date Filters */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white font-serif text-lg">Report Period</CardTitle>
          <CardDescription className="text-zinc-500">
            Filter summary by date range (leave empty for all time)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-zinc-400">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 bg-black border-zinc-800 text-white"
                />
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-zinc-400">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 bg-black border-zinc-800 text-white"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="border-zinc-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs uppercase">New Users</p>
                <p className="font-mono text-2xl text-white">{summary?.new_users || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs uppercase">New Artworks</p>
                <p className="font-mono text-2xl text-white">{summary?.new_artworks || 0}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs uppercase">Purchased</p>
                <p className="font-mono text-2xl text-white">{summary?.purchased_artworks || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs uppercase">Revenue Est.</p>
                <p className="font-mono text-2xl text-green-500">
                  ${summary?.transactions?.reduce((acc, t) => {
                    if (t._id === 'purchase') return acc + (t.total_amount * 0.05);
                    if (t._id === 'p2p_sale') return acc + (t.total_amount * 0.01);
                    return acc;
                  }, 0).toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      {summary?.transactions?.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white font-serif text-lg">Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.transactions.map((tx) => (
                <div key={tx._id} className="p-4 bg-zinc-800/50 rounded">
                  <p className="text-zinc-400 text-sm capitalize">{tx._id?.replace('_', ' ')}</p>
                  <p className="font-mono text-xl text-white">{tx.count} transactions</p>
                  <p className="font-mono text-sm text-green-500">${tx.total_amount?.toFixed(2)}</p>
                  {tx.total_fees > 0 && (
                    <p className="font-mono text-xs text-zinc-500">Fees: ${tx.total_fees.toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white font-serif text-lg">Export Data</CardTitle>
          <CardDescription className="text-zinc-500">
            Download platform data in CSV or JSON format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label className="text-zinc-400 mb-2 block">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-48 bg-black border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-white font-medium">Transactions</p>
                    <p className="text-zinc-500 text-xs">All transaction records</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleExport('transactions')}
                  disabled={isExporting.tx}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isExporting.tx ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Users</p>
                    <p className="text-zinc-500 text-xs">All user accounts</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleExport('users')}
                  disabled={isExporting.users}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isExporting.users ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <ImageIcon className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-white font-medium">Artworks</p>
                    <p className="text-zinc-500 text-xs">All artwork records</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleExport('artworks')}
                  disabled={isExporting.artworks}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isExporting.artworks ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
