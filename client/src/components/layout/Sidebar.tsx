import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Palette, 
  Mail, 
  MessageSquare, 
  Image, 
  Map, 
  Settings 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
  });
  
  const username = userData?.username || "";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/profile", label: "Profile", icon: <User className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/listings", label: "Listings", icon: <FileText className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/theme", label: "Theme", icon: <Palette className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/email-marketing", label: "Email Marketing", icon: <Mail className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/social-content", label: "Social Content", icon: <MessageSquare className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/listing-graphics", label: "Listing Graphics", icon: <Image className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/lot-maps", label: "Lot Maps", icon: <Map className="h-5 w-5 mr-3 text-gray-500" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5 mr-3 text-gray-500" /> },
  ];

  return (
    <aside className={cn("hidden md:flex flex-col w-64 border-r border-gray-200 bg-white", className)}>
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Agent Dashboard</h2>
        <p className="text-sm text-gray-500">@{username}</p>
      </div>
      <nav className="flex-1 space-y-1 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium",
              location === item.href
                ? "sidebar-item active bg-gray-50 text-gray-900 border-l-3 border-primary-600"
                : "sidebar-item text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
