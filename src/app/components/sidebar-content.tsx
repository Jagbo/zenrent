'use client'

import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

// Define navigation items
const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Properties', path: '/properties', icon: BuildingOfficeIcon },
  { name: 'Residents', path: '/residents', icon: UsersIcon },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Issues', path: '/issues', icon: ExclamationCircleIcon },
  { name: 'Financial', path: '/financial', icon: BanknotesIcon },
  { name: 'Suppliers', path: '/suppliers', icon: ShoppingBagIcon },
  { name: 'Integrations', path: '/integrations', icon: CodeBracketIcon },
]

// Define properties
const properties = [
  { id: '123-main', name: '123 Main Street', path: '/properties/123-main' },
  { id: '456-park', name: '456 Park Avenue', path: '/properties/456-park' },
  { id: '789-ocean', name: '789 Ocean Drive', path: '/properties/789-ocean' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function SidebarContent({ currentPath }: { currentPath: string }) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <img
          alt="ZenRent"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="h-8 w-auto"
        />
        <span className="ml-3 text-lg font-semibold">ZenRent</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* Main navigation */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.path}
                    className={classNames(
                      currentPath === item.path
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className={classNames(
                        currentPath === item.path ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                        'size-6 shrink-0',
                      )}
                    />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          
          {/* Properties section */}
          <li>
            <div className="text-xs/6 font-semibold text-gray-400">Your properties</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {properties.map((property) => (
                <li key={property.id}>
                  <a
                    href={property.path}
                    className={classNames(
                      currentPath === property.path
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                    )}
                  >
                    <span
                      className={classNames(
                        currentPath === property.path
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600',
                        'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                      )}
                    >
                      {property.name.charAt(0)}
                    </span>
                    <span className="truncate">{property.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
          
          {/* Settings section at the bottom */}
          <li className="mt-auto">
            <a
              href="/settings"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
            >
              <Cog6ToothIcon
                aria-hidden="true"
                className="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
              />
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
} 