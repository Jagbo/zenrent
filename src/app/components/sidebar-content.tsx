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
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { getProperties, IProperty } from '@/lib/propertyService'
import { useAuth } from '@/lib/auth-provider'
import { Logo } from '@/components/layout/logo'

// Define navigation items
const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Properties', path: '/properties', icon: BuildingOfficeIcon },
  { 
    name: 'Residents', 
    path: '/residents', 
    icon: UsersIcon,
    subItems: [
      { name: 'All Residents', path: '/residents' },
      { name: 'Messages', path: '/residents/messages' }
    ]
  },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Issues', path: '/issues', icon: ExclamationCircleIcon },
  { 
    name: 'Financial', 
    path: '/financial', 
    icon: BanknotesIcon,
    subItems: [
      { name: 'Overview', path: '/financial' },
      { name: 'Transactions', path: '/financial/transactions' },
      { name: 'Tax', path: '/financial/tax/welcome' }
    ]
  },
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Check if a path is under a parent path
  const isPathUnderParent = (path: string, parentPath: string): boolean => {
    // Skip the root path check to avoid all paths matching '/'
    if (parentPath === '/') return false;
    return path.startsWith(parentPath + '/') || path === parentPath;
  };

  // Initialize expanded state - auto-expand if the current path is in the submenu
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    
    navigation.forEach(item => {
      if (item.subItems) {
        // Auto-expand if the current path is a submenu item or the parent path
        const shouldExpand = isPathUnderParent(currentPath, item.path) || 
                           item.subItems.some(subItem => isPathUnderParent(currentPath, subItem.path));
        initialExpandedState[item.name] = shouldExpand;
      }
    });
    
    setExpandedMenus(initialExpandedState);
  }, [currentPath]);

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

  // Toggle menu expansion
  const toggleMenu = (menuName: string, event: React.MouseEvent) => {
    event.preventDefault();
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <Logo width={150} height={32} className="h-8 w-auto" />
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* Main navigation */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <div className="relative">
                    <a
                      href={item.path}
                      className={classNames(
                        (isPathUnderParent(currentPath, item.path) || (item.subItems && item.subItems.some(subItem => isPathUnderParent(currentPath, subItem.path))))
                          ? 'bg-[#F9F7F7] text-[#330015]'
                          : 'text-gray-700 hover:bg-[#F9F7F7] hover:text-[#330015]',
                        'group flex items-center gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                        item.subItems ? 'pr-8' : '',
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className={classNames(
                          (isPathUnderParent(currentPath, item.path) || (item.subItems && item.subItems.some(subItem => isPathUnderParent(currentPath, subItem.path))))
                            ? 'text-[#330015]'
                            : 'text-gray-400 group-hover:text-[#330015]',
                          'size-6 shrink-0',
                        )}
                      />
                      {item.name}
                    </a>
                    
                    {/* Collapsible arrow */}
                    {item.subItems && (
                      <button
                        onClick={(e) => toggleMenu(item.name, e)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[#F9F7F7] transition-colors"
                        aria-label={expandedMenus[item.name] ? 'Collapse menu' : 'Expand menu'}
                      >
                        {expandedMenus[item.name] ? (
                          <ChevronDownIcon className="size-4 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="size-4 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Render sub-items if they exist and menu is expanded */}
                  {item.subItems && expandedMenus[item.name] && (
                    <ul className="mt-1 pl-8 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.name}>
                          <a
                            href={subItem.path}
                            className={classNames(
                              isPathUnderParent(currentPath, subItem.path)
                                ? 'bg-[#F9F7F7] text-[#330015] font-medium'
                                : 'text-gray-600 hover:bg-[#F9F7F7] hover:text-[#330015]',
                              'block rounded-md py-1 px-2 text-sm'
                            )}
                          >
                            {subItem.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </li>
          
          {/* Properties section */}
          <li>
            <div className="text-xs/6 font-semibold text-gray-400">Your properties</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {!user ? (
                <li data-component-name="SidebarContent">
                  <a 
                    href="/login" 
                    className="block px-2 py-1 text-sm text-gray-500 hover:text-gray-900 hover:bg-[#F9F7F7] rounded-md transition-colors"
                  >
                    Sign in to view properties
                  </a>
                </li>
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
                        isPathUnderParent(currentPath, property.path)
                          ? 'bg-[#F9F7F7] text-[#330015]'
                          : 'text-gray-700 hover:bg-[#F9F7F7] hover:text-[#330015]',
                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                      )}
                    >
                      <span
                        className={classNames(
                          isPathUnderParent(currentPath, property.path)
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