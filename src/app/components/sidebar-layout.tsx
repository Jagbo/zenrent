"use client";

import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { SearchAutocomplete } from "./search-autocomplete";
import { useUserProfile } from "../hooks/useUserProfile";
import { UserAvatar } from "./user-avatar";
import { useAuth } from "@/lib/auth-provider";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SidebarContent } from "./sidebar-content";
import { usePathname } from "next/navigation";

// Create client-side only versions of components that use auto-generated IDs
const UserMenu = dynamic(() => Promise.resolve(({ profile, onSignOut }: { profile: any, onSignOut: () => void }) => (
  <Menu as="div" className="relative">
    <MenuButton className="-m-1.5 flex items-center p-1.5">
      <span className="sr-only">Open user menu</span>
      <UserAvatar 
        src={profile?.profile_photo_url}
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        className="size-8"
      />
      <span className="hidden lg:flex lg:items-center">
        <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-gray-900">
          {profile ? `${profile.first_name} ${profile.last_name}` : "Loading..."}
        </span>
        <ChevronDownIcon aria-hidden="true" className="ml-2 size-5 text-gray-400" />
      </span>
    </MenuButton>
    <MenuItems transition className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in">
      <MenuItem>
        <a href="/settings" className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden">
          Your profile
        </a>
      </MenuItem>
      <MenuItem>
        <button onClick={onSignOut} className="block w-full text-left px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden">
          Sign out
        </button>
      </MenuItem>
    </MenuItems>
  </Menu>
)), { ssr: false });

const MobileDialog = dynamic(() => Promise.resolve(({ open, onClose, children }: { open: boolean, onClose: (open: boolean) => void, children: React.ReactNode }) => (
  <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
    <DialogBackdrop
      transition
      className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
    />
    <div className="fixed inset-0 flex">
      <DialogPanel
        transition
        className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
      >
        <TransitionChild>
          <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="-m-2.5 p-2.5"
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon
                aria-hidden="true"
                className="size-6 text-white"
              />
            </button>
          </div>
        </TransitionChild>
        {children}
      </DialogPanel>
    </div>
  </Dialog>
)), { ssr: false });

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function SidebarLayout({
  children,
  searchValue = "",
  onSearchChange,
  isOnboarding = false,
}: React.PropsWithChildren<{
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isOnboarding?: boolean;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading } = useUserProfile();
  const [localSearchValue, setLocalSearchValue] = useState("");
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Use provided search value and handler if available, otherwise use local state
  const searchText = onSearchChange ? searchValue : localSearchValue;
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearchValue(value);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <>
      <div>
        <MobileDialog open={sidebarOpen} onClose={setSidebarOpen}>
          <SidebarContent currentPath={pathname} />
        </MobileDialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component */}
          <SidebarContent currentPath={pathname} />
        </div>

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>

            {/* Separator */}
            <div
              aria-hidden="true"
              className="h-6 w-px bg-gray-200 lg:hidden"
            />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              {!isOnboarding && (
                <div className="flex flex-1 items-center">
                  <label htmlFor="search-field" className="sr-only">
                    Search
                  </label>
                  <SearchAutocomplete
                    searchValue={searchText}
                    onSearchChange={handleSearchChange}
                  />
                </div>
              )}

              {!isOnboarding && (
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                  {/* Profile dropdown */}
                  <UserMenu profile={profile} onSignOut={handleSignOut} />
                </div>
              )}
            </div>
          </div>

          <main className="py-8">
            <div className="px-4 sm:px-8 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
