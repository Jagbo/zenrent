"use client";

import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { LayoutGroup, motion } from "framer-motion";
import React, { forwardRef, useId } from "react";
import { TouchTarget } from "./button";
import { Link } from "../../components/link";

export function Sidebar({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"nav">) {
  return (
    <nav {...props}
      className={clsx(className, "flex h-full min-h-0 flex-col")}
    />
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div {...props}
      className={clsx(
        className,
        "flex flex-col border-b border-zinc-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5",
      )}
    />
  );
}

export function SidebarBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div {...props}
      className={clsx(
        className,
        "flex flex-1 flex-col overflow-y-auto p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8",
      )}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div {...props}
      className={clsx(
        className,
        "flex flex-col border-t border-zinc-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5",
      )}
    />
  );
}

export function SidebarSection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const id = useId();

  return (
    <LayoutGroup id={id}>
      <div {...props}
        data-slot="section"
        className={clsx(className, "flex flex-col gap-0.5")}
      />
    </LayoutGroup>
  );
}

export function SidebarDivider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"hr">) {
  return (
    <hr {...props}
      className={clsx(
        className,
        "my-4 border-t border-zinc-950/5 lg:-mx-4 dark:border-white/5",
      )}
    />
  );
}

export function SidebarSpacer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div aria-hidden="true"
      {...props}
      className={clsx(className, "mt-8 flex-1")}
    />
  );
}

export function SidebarHeading({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3 {...props}
      className={clsx(
        className,
        "mb-1 px-2 text-xs/6 font-medium text-zinc-500 dark:text-zinc-400",
      )}
    />
  );
}

interface SidebarItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export function SidebarItem({ href, icon: Icon, children }: SidebarItemProps) {
  return (
    <Link href={href}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 sm:py-2 sm:text-sm/5"
    >
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </Link>
  );
}

export function SidebarLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return <span {...props} className={clsx(className, "truncate")} />;
}
