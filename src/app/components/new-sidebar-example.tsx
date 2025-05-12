"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, current: true },
  { name: "Team", href: "/team", icon: UsersIcon, current: false },
  { name: "Projects", href: "/projects", icon: FolderIcon, current: false },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon, current: false },
  {
    name: "Documents",
    href: "/documents",
    icon: DocumentDuplicateIcon,
    current: false,
  },
  { name: "Reports", href: "/reports", icon: ChartPieIcon, current: false },
];

const teams = [
  {
    id: 1,
    name: "Manchester",
    href: "/teams/manchester",
    initial: "M",
    current: false,
  },
  {
    id: 2,
    name: "London",
    href: "/teams/london",
    initial: "L",
    current: false,
  },
  {
    id: 3,
    name: "Edinburgh",
    href: "/teams/edinburgh",
    initial: "E",
    current: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SidebarExample() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-chardonnay-50 min-h-screen">
      <Dialog open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop transition
          className="fixed inset-0 bg-chardonnay-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            {/* Sidebar component for mobile */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chardonnay-600 text-white">
                  <Image alt="ZenRent" src="/next.svg" className="h-6 w-auto" width={24} height={24} />
                </div>
                <span className="ml-3 text-lg font-semibold">ZenRent</span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <a href={item.href}
                            className={classNames(
                              item.current
                                ? "bg-chardonnay-50 text-chardonnay-600"
                                : "text-gray-700 hover:bg-chardonnay-50 hover:text-chardonnay-600",
                              "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                item.current
                                  ? "text-chardonnay-600"
                                  : "text-gray-400 group-hover:text-chardonnay-600",
                                "size-6 shrink-0",
                              )}
                            />
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li>
                    <div className="text-xs font-semibold leading-6 text-gray-400">
                      Your teams
                    </div>
                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                      {teams.map((team) => (
                        <li key={team.name}>
                          <a href={team.href}
                            className={classNames(
                              team.current
                                ? "bg-chardonnay-50 text-chardonnay-600"
                                : "text-gray-700 hover:bg-chardonnay-50 hover:text-chardonnay-600",
                              "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                            )}
                          >
                            <span className={classNames(
                                team.current
                                  ? "border-chardonnay-600 text-chardonnay-600"
                                  : "border-gray-200 text-gray-400 group-hover:border-chardonnay-600 group-hover:text-chardonnay-600",
                                "flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium",
                              )}
                            >
                              {team.initial}
                            </span>
                            <span className="truncate">{team.name}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component for desktop */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-chardonnay-100 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chardonnay-600 text-white">
              <Image alt="ZenRent" src="/next.svg" className="h-6 w-auto" width={24} height={24} />
            </div>
            <span className="ml-3 text-lg font-semibold">ZenRent</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-chardonnay-50 text-chardonnay-600"
                            : "text-gray-700 hover:bg-chardonnay-50 hover:text-chardonnay-600",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            item.current
                              ? "text-chardonnay-600"
                              : "text-gray-400 group-hover:text-chardonnay-600",
                            "size-6 shrink-0",
                          )}
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">
                  Your teams
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {teams.map((team) => (
                    <li key={team.name}>
                      <a href={team.href}
                        className={classNames(
                          team.current
                            ? "bg-chardonnay-50 text-chardonnay-600"
                            : "text-gray-700 hover:bg-chardonnay-50 hover:text-chardonnay-600",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                        )}
                      >
                        <span className={classNames(
                            team.current
                              ? "border-chardonnay-600 text-chardonnay-600"
                              : "border-gray-200 text-gray-400 group-hover:border-chardonnay-600 group-hover:text-chardonnay-600",
                            "flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium",
                          )}
                        >
                          {team.initial}
                        </span>
                        <span className="truncate">{team.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <a href="/profile"
                  className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-chardonnay-50"
                >
                  <Image alt="Your profile"
                    src="/profile-photo.jpg"
                    className="size-8 rounded-full bg-gray-50"
                    width={32}
                    height={32}
                  />
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true">Alex Morgan</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button type="button"
          onClick={() => setSidebarOpen(true)}
          className="-m-2.5 p-2.5 text-chardonnay-700 lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          Dashboard
        </div>
        <a href="/profile">
          <span className="sr-only">Your profile</span>
          <Image alt="Your profile"
            src="/profile-photo.jpg"
            className="size-8 rounded-full bg-gray-50"
            width={32}
            height={32}
          />
        </a>
      </div>

      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Dashboard
            </h1>
            <p className="text-gray-600">
              This is a sample dashboard with the chardonnay color scheme
              applied.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Sample cards */}
              <div className="bg-white border border-chardonnay-100 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Properties
                </h2>
                <p className="mt-2 text-3xl font-bold text-chardonnay-600">
                  12
                </p>
              </div>

              <div className="bg-white border border-chardonnay-100 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900">Residents</h2>
                <p className="mt-2 text-3xl font-bold text-chardonnay-600">
                  48
                </p>
              </div>

              <div className="bg-white border border-chardonnay-100 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900">Issues</h2>
                <p className="mt-2 text-3xl font-bold text-chardonnay-600">3</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
