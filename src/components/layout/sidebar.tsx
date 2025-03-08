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
} from "lucide-react";

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
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Image
            src="/next.svg"
            alt="PropBot Logo"
            width={24}
            height={24}
            className="dark:invert"
          />
        </div>
        <span className="text-lg font-semibold">PropBot</span>
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
                    ? "bg-gray-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-blue-600"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">© 2024 PropBot</p>
      </div>
    </div>
  );
} 