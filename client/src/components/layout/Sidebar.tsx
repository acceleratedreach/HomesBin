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
  
  const { data: userData } = useQuery<{ username: string; emailVerified: boolean }>({
    queryKey: ['/api/user'],
  });
  
  const username = userData?.username;
  const isEmailVerified = userData?.emailVerified || false;

  // Only generate nav items if we have a username
  if (!username) return null;

  const navItems = [
    { href: `/${username}/dashboard`, label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/listings`, label: "Listings", icon: <FileText className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/theme`, label: "Theme", icon: <Palette className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/email-marketing`, label: "Email Marketing", icon: <Mail className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/social-content`, label: "Social Content", icon: <MessageSquare className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true, comingSoon: true },
    { href: `/${username}/listing-graphics`, label: "Listing Graphics", icon: <Image className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/lot-maps`, label: "Lot Maps", icon: <Map className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true, comingSoon: true },
    { href: `/${username}/settings`, label: "Settings", icon: <Settings className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: false },
    { href: `/${username}`, label: "View Public Profile", icon: <User className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: false },
  ];

  return (
    <aside className={cn("hidden md:flex flex-col w-64 border-r border-gray-200 bg-white", className)}>
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Agent Dashboard</h2>
        <p className="text-sm text-gray-500">@{username}</p>
      </div>
      <nav className="flex-1 space-y-1 py-4">
        {navItems.map((item) => {
          const isDisabled = !isEmailVerified && item.requiresVerification;
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={isDisabled ? "#" : item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium",
                isActive
                  ? "bg-gray-50 text-gray-900 border-l-3 border-primary-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={e => isDisabled && e.preventDefault()}
            >
              {item.icon}
              {item.label}
              {item.comingSoon && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-medium">
                  Coming Soon
                </span>
              )}
              {isDisabled && !item.comingSoon && (
                <span className="ml-auto text-xs text-gray-500">
                  (Verify email)
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
