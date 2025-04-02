'use client'

import { useState, useEffect } from 'react'
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
import { getProperties, IProperty } from '../../lib/propertyService'
import { useAuth } from '../../lib/auth-provider'

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

// Fallback properties in case API fails
const fallbackProperties = [
  { id: '123-main', name: '123 Main Street', path: '/properties/123-main' },
  { id: '456-park', name: '456 Park Avenue', path: '/properties/456-park' },
  { id: '789-ocean', name: '789 Ocean Drive', path: '/properties/789-ocean' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function SidebarContent({ currentPath }: { currentPath: string }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Array<{ id: string; name: string; path: string; }>>([]);
  const [loading, setLoading] = useState(true);

  // Fetch properties when the component mounts
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Check for authenticated user
        if (!user) {
          console.log('No authenticated user found, waiting for authentication...');
          setProperties([]);
          return;
        }
        
        const propertiesData = await getProperties(user.id);
        
        if (propertiesData && propertiesData.length > 0) {
          // Map Supabase properties to the format needed for sidebar
          const formattedProperties = propertiesData.map((property: IProperty) => ({
            id: property.id,
            name: property.name || property.address,
            path: `/properties/${property.id}`
          }));
          setProperties(formattedProperties);
        } else {
          // Only use fallback in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log('No properties found in development mode, using fallback properties');
            setProperties(fallbackProperties);
          } else {
            setProperties([]);
          }
        }
      } catch (error) {
        console.error('Error fetching properties for sidebar:', error);
        // Only use fallback in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('Error in development mode, using fallback properties');
          setProperties(fallbackProperties);
        } else {
          setProperties([]);
        }
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
              {loading ? (
                <li className="px-2 py-1 text-sm text-gray-500">Loading properties...</li>
              ) : properties.length === 0 ? (
                <li className="px-2 py-1 text-sm text-gray-500">No properties found</li>
              ) : (
                properties.map((property, index) => (
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