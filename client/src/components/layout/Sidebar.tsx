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
  const isEmailVerified = userData?.emailVerified || false;

  // Generate links based on username for the custom URL structure
  const navItems = username ? [
    { href: `/${username}/dashboard`, label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}`, label: "Profile", icon: <User className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: false },
    { href: `/${username}/listings`, label: "Listings", icon: <FileText className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/theme`, label: "Theme", icon: <Palette className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/email-marketing`, label: "Email Marketing", icon: <Mail className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/social-content`, label: "Social Content", icon: <MessageSquare className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/listing-graphics`, label: "Listing Graphics", icon: <Image className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/lot-maps`, label: "Lot Maps", icon: <Map className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: `/${username}/settings`, label: "Settings", icon: <Settings className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: false },
  ] : [
    // Fallback if no username is available
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: "/profile", label: "Profile", icon: <User className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: false },
    { href: "/listings", label: "Listings", icon: <FileText className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: "/theme", label: "Theme", icon: <Palette className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: "/email-marketing", label: "Email Marketing", icon: <Mail className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: "/social-content", label: "Social Content", icon: <MessageSquare className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: "/listing-graphics", label: "Listing Graphics", icon: <Image className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: "/lot-maps", label: "Lot Maps", icon: <Map className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: true },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5 mr-3 text-gray-500" />, requiresVerification: false },
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
          const itemComponent = (
            <div
              key={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium",
                (location === item.href || 
                 // Handle both old and new URL patterns for active state
                 (item.href.includes(`/${username}/`) && location.includes(item.href.split(`/${username}/`)[1])) ||
                 // Special case for profile which is just /:username
                 (item.label === "Profile" && location === `/${username}`))
                  ? "sidebar-item active bg-gray-50 text-gray-900 border-l-3 border-primary-600"
                  : "sidebar-item text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {item.icon}
              {item.label}
              {isDisabled && (
                <span className="ml-auto text-xs text-gray-500">
                  (Verify email)
                </span>
              )}
            </div>
          );

          if (isDisabled) {
            return itemComponent;
          }

          return (
            <Link key={item.href} href={item.href}>
              {itemComponent}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
