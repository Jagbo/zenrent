"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  AlertCircle,
  DollarSign,
  Truck,
  Wrench,
  ChevronUp,
  User,
  Cog,
  ShieldCheck,
  Lightbulb,
  LogOut,
} from "lucide-react";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from "../../app/components/dropdown";
import { useAuth } from "@/lib/auth-provider";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Residents", href: "/residents", icon: Users },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Issues", href: "/issues", icon: AlertCircle },
  { name: "Financial", href: "/financial", icon: DollarSign },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Integrations", href: "/integrations", icon: Wrench },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
      <div className="flex h-16 items-center justify-center px-6">
        <div className="flex h-12 w-12 items-center justify-center">
          <Image src="/images/logo/zenrent-logo.png"
            alt="ZenRent Logo"
            width={48}
            height={48}
            className="h-auto w-auto object-contain"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-gray-50 text-blue-600 dark:bg-zinc-800 dark:text-white"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive
                      ? "text-blue-600 dark:text-white"
                      : "text-gray-400 group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-white"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-gray-200 p-4 dark:border-white/10">
        <Dropdown>
          <DropdownButton className="flex w-full items-center gap-3">
            <span className="flex min-w-0 items-center gap-3">
              <Image src="/profile-photo.jpg"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
                alt=""
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || "User"}
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-zinc-400">
                  {user?.email || "email@example.com"}
                </span>
              </span>
            </span>
            <ChevronUp className="ml-auto h-5 w-5 text-gray-400" />
          </DropdownButton>
          <DropdownMenu className="min-w-64">
            <DropdownItem href="/my-profile">
              <User className="h-5 w-5" data-slot="icon" />
              My profile
            </DropdownItem>
            <DropdownItem href="/settings">
              <Cog className="h-5 w-5" data-slot="icon" />
              Settings
            </DropdownItem>
            <hr className="my-1 border-gray-200 dark:border-white/10" />
            <DropdownItem href="/privacy-policy">
              <ShieldCheck className="h-5 w-5" data-slot="icon" />
              Privacy policy
            </DropdownItem>
            <DropdownItem href="/share-feedback">
              <Lightbulb className="h-5 w-5" data-slot="icon" />
              Share feedback
            </DropdownItem>
            <hr className="my-1 border-gray-200 dark:border-white/10" />
            <DropdownItem onClick={handleSignOut}>
              <LogOut className="h-5 w-5" data-slot="icon" />
              Sign out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
