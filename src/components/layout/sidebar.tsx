"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  DropdownDivider, 
  DropdownLabel 
} from "../../app/components/dropdown";

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

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Image
            src="/next.svg"
            alt="ZenRent Logo"
            width={24}
            height={24}
            className="dark:invert"
          />
        </div>
        <span className="text-lg font-semibold">ZenRent</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
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
          <DropdownButton as="button" className="flex w-full items-center gap-3">
            <span className="flex min-w-0 items-center gap-3">
              <Image
                src="/profile-photo.jpg"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
                alt=""
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                  Erica
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-zinc-400">
                  erica@example.com
                </span>
              </span>
            </span>
            <ChevronUp className="ml-auto h-5 w-5 text-gray-400" />
          </DropdownButton>
          <DropdownMenu className="min-w-64" anchor="top start">
            <DropdownItem href="/my-profile">
              <User className="h-5 w-5" data-slot="icon" />
              <DropdownLabel>My profile</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/settings">
              <Cog className="h-5 w-5" data-slot="icon" />
              <DropdownLabel>Settings</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/privacy-policy">
              <ShieldCheck className="h-5 w-5" data-slot="icon" />
              <DropdownLabel>Privacy policy</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/share-feedback">
              <Lightbulb className="h-5 w-5" data-slot="icon" />
              <DropdownLabel>Share feedback</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/logout">
              <LogOut className="h-5 w-5" data-slot="icon" />
              <DropdownLabel>Sign out</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
} 