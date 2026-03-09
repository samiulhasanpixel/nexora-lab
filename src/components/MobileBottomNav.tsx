import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Clock, User, LayoutDashboard, Users, Pencil, Settings } from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const customerNav: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard/customer" },
  { icon: Clock, label: "My Queue", path: "/dashboard/customer" },
  { icon: Search, label: "Search", path: "/dashboard/customer" },
  { icon: User, label: "Profile", path: "/dashboard/customer" },
];

const sellerNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/seller" },
  { icon: Users, label: "Queue", path: "/dashboard/seller" },
  { icon: Pencil, label: "Edit", path: "/dashboard/seller/edit" },
  { icon: Settings, label: "Settings", path: "/dashboard/seller/settings" },
];

interface MobileBottomNavProps {
  role: 'customer' | 'seller';
}

const MobileBottomNav = ({ role }: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = role === 'seller' ? sellerNav : customerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
