import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Store, BarChart3, LogOut, Shield, Search, Download,
  Hash, ChevronDown, Eye, ToggleLeft, ToggleRight, Loader2,
  Calendar, CheckCircle, Clock, XCircle, RefreshCw, Activity, CreditCard
} from "lucide-react";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [planFilter, setPlanFilter] = useState("expired");
  const [upgradeDays, setUpgradeDays] = useState<Record<string, number>>({});

  const loadData = async () => {
    try {
      const [statsRes, usersRes, sellersRes, bookingsRes] = await Promise.all([
        supabase.rpc('admin_get_stats'),
        supabase.rpc('admin_get_all_users'),
        supabase.rpc('admin_get_all_sellers'),
        supabase.rpc('admin_get_all_bookings'),
      ]);

      if (statsRes.error) throw statsRes.error;
      setStats(statsRes.data);
      setUsers((usersRes.data as any) || []);
      setSellers((sellersRes.data as any) || []);
      setBookings((bookingsRes.data as any) || []);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
        toast({ title: "Unauthorized", description: "Admin access required.", variant: "destructive" });
        navigate('/');
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin/login'); return; }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
      if (!role) { navigate('/'); return; }
      loadData();
    };
    checkAdmin();
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({ title: "Refreshed", description: "Data updated." });
  };

  const toggleSellerActive = async (sellerUserId: string, currentActive: boolean) => {
    try {
      await supabase.rpc('admin_toggle_seller_active', {
        p_seller_user_id: sellerUserId,
        p_active: !currentActive,
      });
      toast({ title: currentActive ? "Blocked" : "Activated", description: `Seller ${currentActive ? 'blocked' : 'activated'} successfully.` });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleSellerUpgrade = async (sellerUserId: string, activate: boolean) => {
    try {
      const days = upgradeDays[sellerUserId] || 30;
      await supabase.rpc('admin_upgrade_seller', {
        p_seller_user_id: sellerUserId,
        p_active: activate,
        p_days: days,
      });
      toast({ title: activate ? "Upgraded" : "Deactivated", description: `Seller ${activate ? `upgraded for ${days} days` : 'set to expired'}.` });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Filtered data
  const filteredUsers = users.filter(u => {
    const matchSearch = !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const filteredSellers = sellers.filter(s => {
    const matchSearch = !searchQuery ||
      s.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.unique_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery);
    return matchSearch;
  });

  const filteredBookings = bookings.filter(b => {
    const matchSearch = !searchQuery ||
      b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.seller_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Customers", value: stats?.total_customers || 0, icon: Users, color: "gradient-primary" },
    { label: "Sellers", value: stats?.total_sellers || 0, icon: Store, color: "gradient-seller" },
    { label: "Total Bookings", value: stats?.total_bookings || 0, icon: Hash, color: "gradient-accent" },
    { label: "Active", value: stats?.active_bookings || 0, icon: Clock, color: "bg-primary" },
    { label: "Completed", value: stats?.completed_bookings || 0, icon: CheckCircle, color: "bg-green-500" },
    { label: "Cancelled", value: stats?.cancelled_bookings || 0, icon: XCircle, color: "bg-destructive" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">QueuePro Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by name, phone, code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="users" className="gap-1"><Users className="w-4 h-4" /> Users</TabsTrigger>
            <TabsTrigger value="sellers" className="gap-1"><Store className="w-4 h-4" /> Sellers</TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1"><CreditCard className="w-4 h-4" /> Plans</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1"><BarChart3 className="w-4 h-4" /> Bookings</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1"><Activity className="w-4 h-4" /> Analytics</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>
              <Button variant="outline" size="sm" onClick={() => exportCSV(filteredUsers, 'users')} className="gap-1">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
            <div className="space-y-2">
              {filteredUsers.map((user, i) => (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{user.full_name || 'No Name'}</p>
                      <p className="text-xs text-muted-foreground">{user.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === 'seller' ? 'default' : 'secondary'} className="text-xs">
                      {user.role || 'N/A'}
                    </Badge>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{user.total_bookings} bookings</p>
                      <p>{user.active_bookings} active</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found.</p>
              )}
            </div>
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filteredSellers.length} sellers</p>
              <Button variant="outline" size="sm" onClick={() => exportCSV(filteredSellers, 'sellers')} className="gap-1">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
            <div className="space-y-2">
              {filteredSellers.map((seller, i) => (
                <motion.div
                  key={seller.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {seller.profile_image_url ? (
                        <img src={seller.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full gradient-seller flex items-center justify-center">
                          <Store className="w-5 h-5 text-seller-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground text-sm">{seller.business_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{seller.unique_code}</p>
                        <p className="text-xs text-muted-foreground">{seller.full_name} • {seller.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{seller.total_bookings} total</p>
                        <p>{seller.active_bookings} active • {seller.completed_bookings} done</p>
                      </div>
                      {seller.category && (
                        <Badge variant="outline" className="text-xs">{seller.category}</Badge>
                      )}
                      <Button
                        variant={seller.is_active ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => toggleSellerActive(seller.user_id, seller.is_active)}
                      >
                        {seller.is_active ? (
                          <><ToggleRight className="w-4 h-4 mr-1" /> Active</>
                        ) : (
                          <><ToggleLeft className="w-4 h-4 mr-1" /> Blocked</>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredSellers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No sellers found.</p>
              )}
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                {sellers.filter((s: any) => {
                  const now = new Date();
                  const trialEnd = s.trial_end_date ? new Date(s.trial_end_date) : null;
                  const subEnd = s.subscription_end ? new Date(s.subscription_end) : null;
                  return s.plan_status === 'expired' || 
                    (s.plan_status === 'trial' && trialEnd && now > trialEnd) ||
                    (s.plan_status === 'active' && subEnd && now > subEnd);
                }).length} expired sellers
              </p>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {sellers.filter((seller: any) => {
                const now = new Date();
                const trialEnd = seller.trial_end_date ? new Date(seller.trial_end_date) : null;
                const subEnd = seller.subscription_end ? new Date(seller.subscription_end) : null;
                const isExpired = seller.plan_status === 'expired' || 
                  (seller.plan_status === 'trial' && trialEnd && now > trialEnd) ||
                  (seller.plan_status === 'active' && subEnd && now > subEnd);
                const isActive = seller.plan_status === 'active' && (!subEnd || now <= subEnd);
                const currentStatus = isExpired ? 'expired' : isActive ? 'active' : 'trial';
                return planFilter === 'all' || currentStatus === planFilter;
              }).map((seller: any, i: number) => {
                const now = new Date();
                const trialEnd = seller.trial_end_date ? new Date(seller.trial_end_date) : null;
                const subEnd = seller.subscription_end ? new Date(seller.subscription_end) : null;
                const isExpired = seller.plan_status === 'expired' || 
                  (seller.plan_status === 'trial' && trialEnd && now > trialEnd) ||
                  (seller.plan_status === 'active' && subEnd && now > subEnd);
                const isActive = seller.plan_status === 'active' && (!subEnd || now <= subEnd);
                const statusLabel = isExpired ? 'Expired' : isActive ? 'Active' : 'Trial';
                const endDate = isActive ? subEnd : trialEnd;
                const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

                return (
                  <motion.div
                    key={seller.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="glass-card rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpired ? 'bg-destructive/10' : 'gradient-seller'}`}>
                        <Store className={`w-5 h-5 ${isExpired ? 'text-destructive' : 'text-seller-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{seller.business_name}</p>
                        <p className="text-xs text-muted-foreground">{seller.full_name} • {seller.phone || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {isExpired ? `Expired: ${(subEnd || trialEnd)?.toLocaleDateString() || 'N/A'}` : 
                           `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={isExpired ? 'destructive' : isActive ? 'default' : 'secondary'} className="text-xs">
                        {statusLabel}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          className="w-16 h-8 text-xs text-center"
                          placeholder="30"
                          value={upgradeDays[seller.user_id] || ''}
                          onChange={e => setUpgradeDays(prev => ({ ...prev, [seller.user_id]: parseInt(e.target.value) || 30 }))}
                        />
                        <span className="text-xs text-muted-foreground">days</span>
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => toggleSellerUpgrade(seller.user_id, checked)}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {sellers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No sellers found.</p>
              )}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filteredBookings.length} bookings</p>
              <Button variant="outline" size="sm" onClick={() => exportCSV(filteredBookings, 'bookings')} className="gap-1">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
            <div className="space-y-2">
              {filteredBookings.slice(0, 100).map((booking, i) => {
                const statusColors: Record<string, string> = {
                  waiting: 'bg-accent/15 text-accent',
                  in_progress: 'bg-primary/15 text-primary',
                  completed: 'bg-green-100 text-green-700',
                  cancelled: 'bg-destructive/15 text-destructive',
                };
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="glass-card rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                        <Hash className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Token #{booking.token_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.customer_name} → {booking.seller_name} ({booking.seller_code})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status] || ''}`}>
                      {booking.status}
                    </span>
                  </motion.div>
                );
              })}
              {filteredBookings.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No bookings found.</p>
              )}
            </div>
          </TabsContent>
          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
