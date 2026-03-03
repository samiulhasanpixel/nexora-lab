import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Store, BarChart3, LogOut, Shield, Search, Download,
  Hash, Eye, ToggleLeft, ToggleRight, Loader2,
  Calendar, CheckCircle, Clock, XCircle, RefreshCw,
  LayoutDashboard, ChevronRight, Ban, UserCheck, TrendingUp,
  Activity, MapPin, Filter, X, Menu, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type Section = "dashboard" | "users" | "sellers" | "bookings" | "analytics";

const sidebarItems: { id: Section; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "sellers", label: "Sellers", icon: Store },
  { id: "bookings", label: "Bookings", icon: Hash },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

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
  const [sellerStatusFilter, setSellerStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);

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
      await supabase.rpc('admin_toggle_seller_active', { p_seller_user_id: sellerUserId, p_active: !currentActive });
      toast({ title: currentActive ? "Blocked" : "Activated", description: `Seller ${currentActive ? 'blocked' : 'activated'}.` });
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
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  // Filtered data
  const filteredUsers = useMemo(() => users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, searchQuery, roleFilter]);

  const filteredSellers = useMemo(() => sellers.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.business_name?.toLowerCase().includes(q) || s.unique_code?.toLowerCase().includes(q) || s.phone?.includes(q) || s.full_name?.toLowerCase().includes(q);
    const matchStatus = sellerStatusFilter === 'all' || (sellerStatusFilter === 'active' ? s.is_active : !s.is_active);
    return matchSearch && matchStatus;
  }), [sellers, searchQuery, sellerStatusFilter]);

  const filteredBookings = useMemo(() => bookings.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || b.customer_name?.toLowerCase().includes(q) || b.seller_name?.toLowerCase().includes(q) || b.seller_code?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  }), [bookings, searchQuery, statusFilter]);

  // Analytics
  const analyticsData = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.created_at?.startsWith(today));
    const last7 = bookings.filter(b => {
      const d = new Date(b.created_at);
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    });
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const avgPerSeller = sellers.length ? Math.round(bookings.length / sellers.length) : 0;
    const topSellers = [...sellers].sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0)).slice(0, 5);
    
    // Daily breakdown for last 7 days
    const dailyBreakdown: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      dailyBreakdown.push({
        date: d.toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric' }),
        count: bookings.filter(b => b.created_at?.startsWith(ds)).length
      });
    }
    
    return { todayBookings: todayBookings.length, last7Bookings: last7.length, completedRate: bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0, avgPerSeller, topSellers, dailyBreakdown };
  }, [bookings, sellers]);

  // Get user bookings for detail view
  const getUserBookings = (userId: string) => bookings.filter(b => b.customer_id === userId);
  const getSellerBookings = (sellerId: string) => bookings.filter(b => b.seller_id === sellerId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Customers", value: stats?.total_customers || 0, icon: Users, bg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Total Sellers", value: stats?.total_sellers || 0, icon: Store, bg: "bg-seller/10", iconColor: "text-seller" },
    { label: "Total Bookings", value: stats?.total_bookings || 0, icon: Hash, bg: "bg-accent/10", iconColor: "text-accent" },
    { label: "Active", value: stats?.active_bookings || 0, icon: Clock, bg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Completed", value: stats?.completed_bookings || 0, icon: CheckCircle, bg: "bg-green-500/10", iconColor: "text-green-600" },
    { label: "Cancelled", value: stats?.cancelled_bookings || 0, icon: XCircle, bg: "bg-destructive/10", iconColor: "text-destructive" },
  ];

  const statusColors: Record<string, string> = {
    waiting: 'bg-accent/15 text-accent',
    in_progress: 'bg-primary/15 text-primary',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-destructive/15 text-destructive',
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground text-sm">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">QueuePro</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); setSelectedUser(null); setSelectedSeller(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                activeSection === item.id
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="font-display font-bold text-foreground capitalize">{activeSection}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Search bar - global */}
          {activeSection !== 'dashboard' && activeSection !== 'analytics' && (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search by name, phone, code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              {activeSection === 'users' && (
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {activeSection === 'sellers' && (
                <Select value={sellerStatusFilter} onValueChange={setSellerStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {activeSection === 'bookings' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                const data = activeSection === 'users' ? filteredUsers : activeSection === 'sellers' ? filteredSellers : filteredBookings;
                exportCSV(data, activeSection);
              }}>
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
          )}

          {/* ========== DASHBOARD ========== */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="border-border/50">
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                          <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                        </div>
                        <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Quick overview cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Today's Bookings</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-display font-bold text-foreground">{analyticsData.todayBookings}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Last 7 Days</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-display font-bold text-foreground">{analyticsData.last7Bookings}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Completion Rate</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-display font-bold text-foreground">{analyticsData.completedRate}%</p></CardContent>
                </Card>
              </div>

              {/* Recent bookings */}
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Recent Bookings</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">Token #{b.token_number} — {b.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{b.seller_name} • {new Date(b.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || ''}`}>{b.status}</span>
                    </div>
                  ))}
                  {bookings.length === 0 && <p className="text-center text-muted-foreground py-4">No bookings yet.</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========== USERS ========== */}
          {activeSection === 'users' && !selectedUser && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{filteredUsers.length} users found</p>
              <div className="space-y-2">
                {filteredUsers.map((user, i) => (
                  <motion.div key={user.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="glass-card rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {user.avatar_url ? <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : <Users className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{user.full_name || 'No Name'}</p>
                        <p className="text-xs text-muted-foreground">{user.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={user.role === 'seller' ? 'default' : 'secondary'} className="text-xs">{user.role || 'N/A'}</Badge>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{user.total_bookings} bookings</p>
                        <p>{user.active_bookings} active</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
                {filteredUsers.length === 0 && <p className="text-center text-muted-foreground py-8">No users found.</p>}
              </div>
            </div>
          )}

          {/* User Detail View */}
          {activeSection === 'users' && selectedUser && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="gap-1 text-muted-foreground">
                <X className="w-4 h-4" /> Back to Users
              </Button>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-16 h-16 rounded-full object-cover" /> : <Users className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-foreground">{selectedUser.full_name || 'No Name'}</h3>
                      <p className="text-sm text-muted-foreground">{selectedUser.phone || 'No phone'}</p>
                      <Badge variant={selectedUser.role === 'seller' ? 'default' : 'secondary'} className="mt-1">{selectedUser.role || 'N/A'}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedUser.total_bookings}</p>
                      <p className="text-xs text-muted-foreground">Total Bookings</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedUser.active_bookings}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedUser.phone_verified ? '✓' : '✗'}</p>
                      <p className="text-xs text-muted-foreground">Phone Verified</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-sm font-medium text-foreground">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">Joined</p>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Booking History</h4>
                  <div className="space-y-2">
                    {getUserBookings(selectedUser.user_id).slice(0, 20).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm text-foreground">Token #{b.token_number} → {b.seller_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || ''}`}>{b.status}</span>
                      </div>
                    ))}
                    {getUserBookings(selectedUser.user_id).length === 0 && <p className="text-sm text-muted-foreground">No bookings.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========== SELLERS ========== */}
          {activeSection === 'sellers' && !selectedSeller && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{filteredSellers.length} sellers found</p>
              <div className="space-y-2">
                {filteredSellers.map((seller, i) => (
                  <motion.div key={seller.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => setSelectedSeller(seller)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {seller.profile_image_url ? (
                          <img src={seller.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-seller/10 flex items-center justify-center">
                            <Store className="w-5 h-5 text-seller" />
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
                        {seller.category && <Badge variant="outline" className="text-xs">{seller.category}</Badge>}
                        <Button variant={seller.is_active ? "outline" : "destructive"} size="sm"
                          onClick={e => { e.stopPropagation(); toggleSellerActive(seller.user_id, seller.is_active); }}>
                          {seller.is_active ? <><ToggleRight className="w-4 h-4 mr-1" /> Active</> : <><ToggleLeft className="w-4 h-4 mr-1" /> Blocked</>}
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredSellers.length === 0 && <p className="text-center text-muted-foreground py-8">No sellers found.</p>}
              </div>
            </div>
          )}

          {/* Seller Detail View */}
          {activeSection === 'sellers' && selectedSeller && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSeller(null)} className="gap-1 text-muted-foreground">
                <X className="w-4 h-4" /> Back to Sellers
              </Button>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    {selectedSeller.profile_image_url ? (
                      <img src={selectedSeller.profile_image_url} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-seller/10 flex items-center justify-center">
                        <Store className="w-8 h-8 text-seller" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-bold text-foreground">{selectedSeller.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedSeller.full_name} • {selectedSeller.phone || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedSeller.unique_code}</p>
                      <div className="flex gap-2 mt-2">
                        {selectedSeller.category && <Badge variant="outline">{selectedSeller.category}</Badge>}
                        <Badge variant={selectedSeller.is_active ? 'default' : 'destructive'}>{selectedSeller.is_active ? 'Active' : 'Blocked'}</Badge>
                      </div>
                    </div>
                    <Button variant={selectedSeller.is_active ? "destructive" : "default"} size="sm"
                      onClick={() => { toggleSellerActive(selectedSeller.user_id, selectedSeller.is_active); setSelectedSeller({ ...selectedSeller, is_active: !selectedSeller.is_active }); }}>
                      {selectedSeller.is_active ? <><Ban className="w-4 h-4 mr-1" /> Block</> : <><UserCheck className="w-4 h-4 mr-1" /> Activate</>}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedSeller.total_bookings}</p>
                      <p className="text-xs text-muted-foreground">Total Bookings</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedSeller.active_bookings}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedSeller.completed_bookings}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedSeller.rating || 0}⭐</p>
                      <p className="text-xs text-muted-foreground">{selectedSeller.total_reviews || 0} reviews</p>
                    </div>
                  </div>
                  {selectedSeller.address && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {selectedSeller.address}
                    </div>
                  )}
                  <h4 className="text-sm font-semibold text-foreground mb-3">Booking History</h4>
                  <div className="space-y-2">
                    {getSellerBookings(selectedSeller.user_id).slice(0, 20).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm text-foreground">Token #{b.token_number} — {b.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || ''}`}>{b.status}</span>
                      </div>
                    ))}
                    {getSellerBookings(selectedSeller.user_id).length === 0 && <p className="text-sm text-muted-foreground">No bookings.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========== BOOKINGS ========== */}
          {activeSection === 'bookings' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{filteredBookings.length} bookings found</p>
              <div className="space-y-2">
                {filteredBookings.slice(0, 200).map((b, i) => (
                  <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                    className="glass-card rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Token #{b.token_number}</p>
                        <p className="text-xs text-muted-foreground">{b.customer_name} → {b.seller_name} ({b.seller_code})</p>
                        <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || ''}`}>{b.status}</span>
                  </motion.div>
                ))}
                {filteredBookings.length === 0 && <p className="text-center text-muted-foreground py-8">No bookings found.</p>}
              </div>
            </div>
          )}

          {/* ========== ANALYTICS ========== */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-foreground">{analyticsData.todayBookings}</p>
                    <p className="text-xs text-muted-foreground">Today's Bookings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-foreground">{analyticsData.last7Bookings}</p>
                    <p className="text-xs text-muted-foreground">Last 7 Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-primary">{analyticsData.completedRate}%</p>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-foreground">{analyticsData.avgPerSeller}</p>
                    <p className="text-xs text-muted-foreground">Avg/Seller</p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily chart - simple bar */}
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Last 7 Days Bookings</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-40">
                    {analyticsData.dailyBreakdown.map((d, i) => {
                      const maxCount = Math.max(...analyticsData.dailyBreakdown.map(x => x.count), 1);
                      const height = (d.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-foreground">{d.count}</span>
                          <div className="w-full rounded-t-lg bg-primary/20 relative" style={{ height: `${Math.max(height, 4)}%` }}>
                            <div className="absolute inset-0 rounded-t-lg bg-primary" style={{ height: `${height}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{d.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top sellers */}
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Top Sellers</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {analyticsData.topSellers.map((s, i) => (
                    <div key={s.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.business_name}</p>
                          <p className="text-xs text-muted-foreground">{s.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{s.total_bookings}</p>
                        <p className="text-xs text-muted-foreground">bookings</p>
                      </div>
                    </div>
                  ))}
                  {analyticsData.topSellers.length === 0 && <p className="text-sm text-muted-foreground">No sellers yet.</p>}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
