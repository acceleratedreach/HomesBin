import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  LucideIcon,
  Settings, 
  LogOut, 
  UserCircle,
  Palette, 
  Home,
  ListFilter,
  Mail, 
  Image, 
  MapPin,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface UserData {
  username?: string;
  fullName?: string;
  profileImage?: string;
}

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  activeMatches?: string[];
}

export default function DashboardSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  
  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/user'],
  });
  
  const username = userData?.username || '';
  
  // Generate user-specific links only when username is available
  const [mainLinks, setMainLinks] = useState<NavLink[]>([]);
  const [accountLinks, setAccountLinks] = useState<NavLink[]>([]);
  
  useEffect(() => {
    if (!username) return;
    
    setMainLinks([
      {
        label: "Dashboard",
        href: `/${username}/dashboard`,
        icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
        activeMatches: ['/dashboard']
      },
      {
        label: "Listings",
        href: `/${username}/listings`,
        icon: <ListFilter className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
        activeMatches: ['/listings', '/listing-create', '/listing-edit']
      },
      {
        label: "Marketing",
        href: `/${username}/email-marketing`,
        icon: <Mail className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
        activeMatches: ['/email-marketing']
      },
      {
        label: "Social Content",
        href: `/${username}/social-content`,
        icon: <Image className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
        activeMatches: ['/social-content', '/listing-graphics']
      },
      {
        label: "Lot Maps",
        href: `/${username}/lot-maps`,
        icon: <MapPin className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
        activeMatches: ['/lot-maps', '/lot-maps/']
      }
    ]);
    
    setAccountLinks([
      {
        label: "Profile",
        href: `/profile/${username}`,
        icon: <UserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      },
      {
        label: "Theme",
        href: `/${username}/theme`,
        icon: <Palette className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
        activeMatches: ['/theme']
      },
      {
        label: "Settings",
        href: `/${username}/settings`,
        icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
        activeMatches: ['/settings']
      },
    ]);
  }, [username]);

  // Check if current path matches any of the activeMatches
  const isActive = (link: NavLink) => {
    if (!link.activeMatches) return location === link.href;
    return link.activeMatches.some(match => location.includes(match));
  };

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div>
            {open ? <Logo username={username} /> : <LogoIcon username={username} />}
          </div>
          
          <div className="mt-8 flex flex-col gap-2">
            {mainLinks.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={{
                  ...link,
                  icon: React.cloneElement(link.icon as React.ReactElement, {
                    className: cn(
                      (link.icon as React.ReactElement).props.className,
                      isActive(link) ? "text-primary" : ""
                    )
                  })
                }}
                className={isActive(link) ? "font-medium" : ""}
              />
            ))}
      </div>
          
          <div className="mt-10 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <span className={open ? "text-xs text-neutral-500 dark:text-neutral-400 px-2 mb-2 block" : "hidden"}>
              Account
                </span>
            {accountLinks.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={{
                  ...link,
                  icon: React.cloneElement(link.icon as React.ReactElement, {
                    className: cn(
                      (link.icon as React.ReactElement).props.className,
                      isActive(link) ? "text-primary" : ""
                    )
                  })
                }}
                className={isActive(link) ? "font-medium" : ""}
              />
            ))}
          </div>
        </div>
        <div>
          {userData && (
            <SidebarLink
              link={{
                label: userData.fullName || userData.username || "User",
                href: `/${username}/settings`,
                icon: (
                  userData.profileImage ? (
                    <img
                      src={userData.profileImage}
                      className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <UserCircle className="h-7 w-7 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                  )
                ),
              }}
            />
              )}
            </div>
      </SidebarBody>
    </Sidebar>
          );
          }

// Logo components
const Logo = ({ username }: { username: string }) => {
          return (
    <a
      href={username ? `/${username}/dashboard` : "/dashboard"}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Agent Tools
      </motion.span>
    </a>
  );
};

const LogoIcon = ({ username }: { username: string }) => {
  return (
    <a
      href={username ? `/${username}/dashboard` : "/dashboard"}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </a>
  );
};
