'use client'

import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
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
import { getProperties, IProperty } from '@/lib/propertyService'
import { useAuth } from '@/lib/auth-provider'

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

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

export function SidebarContent({ currentPath }: { currentPath: string }): ReactElement {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Array<{ id: string; name: string; path: string; }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user?.id) {
        setLoading(false);
        setProperties([]);
        return;
      }

      try {
        setLoading(true);
        const propertiesData = await getProperties(user.id);
        
        if (propertiesData && propertiesData.length > 0) {
          const formattedProperties = propertiesData.map((property: IProperty) => ({
            id: property.id,
            name: property.address || property.property_code,
            path: `/properties/${property.id}`
          }));
          setProperties(formattedProperties);
        } else {
          setProperties([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user]);

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <img
          alt="ZenRent"
          src="/images/logo/zenrent-logo.png"
          className="h-8 w-auto"
        />
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
                        ? 'bg-[#F9F7F7] text-[#330015]'
                        : 'text-gray-700 hover:bg-[#F9F7F7] hover:text-[#330015]',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className={classNames(
                        currentPath === item.path ? 'text-[#330015]' : 'text-gray-400 group-hover:text-[#330015]',
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
              {!user ? (
                <li className="px-2 py-1 text-sm text-gray-500">Sign in to view properties</li>
              ) : loading ? (
                <li className="px-2 py-1 text-sm text-gray-500">Loading properties...</li>
              ) : properties.length === 0 ? (
                <li className="px-2 py-1 text-sm text-gray-500">No properties found</li>
              ) : (
                properties.map((property: { id: string; name: string; path: string }, index: number) => (
                  <li key={property.id}>
                    <a
                      href={property.path}
                      className={classNames(
                        currentPath === property.path
                          ? 'bg-[#F9F7F7] text-[#330015]'
                          : 'text-gray-700 hover:bg-[#F9F7F7] hover:text-[#330015]',
                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                      )}
                    >
                      <span
                        className={classNames(
                          currentPath === property.path
                            ? 'border-[#330015] text-[#330015]'
                            : 'border-gray-200 text-gray-400 group-hover:border-[#330015] group-hover:text-[#330015]',
                          'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="truncate">{property.name}</span>
                    </a>
                  </li>
                ))
              )}
            </ul>
          </li>
          
          {/* Settings section at the bottom */}
          <li className="mt-auto">
            <a
              href="/settings"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Cog6ToothIcon
                aria-hidden="true"
                className="size-6 shrink-0 text-gray-400 group-hover:text-[#330015]"
              />
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
} 