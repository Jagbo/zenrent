'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ITenant } from '../../lib/propertyService'

// Helper to create placeholder image URLs from name
const getInitialsAvatar = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
}

// Define tenant with UI specific properties
interface TenantWithUI extends ITenant {
  property_name: string;
  property_address?: string;
  image: string;
  unreadCount?: number;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
}

interface PropertyListItem {
  id: string;
  name: string;
}

interface TenantsByPropertyForMessagesProps {
  tenants: TenantWithUI[];
  properties: PropertyListItem[];
  selectedTenant: TenantWithUI | null;
  onSelectTenant: (tenant: TenantWithUI) => void;
}

export function TenantsByPropertyForMessages({
  tenants,
  properties,
  selectedTenant,
  onSelectTenant
}: TenantsByPropertyForMessagesProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');

  // Filter tenants by selected property
  const filteredTenants = selectedPropertyId === 'all'
    ? tenants
    : tenants.filter((t: TenantWithUI) => t.property_address === selectedPropertyId);

  // Group tenants by property
  const tenantsByProperty: Record<string, TenantWithUI[]> = {};
  
  filteredTenants.forEach((tenant: TenantWithUI) => {
    const propertyName = tenant.property_address || 'Unassigned';
    if (!tenantsByProperty[propertyName]) {
      tenantsByProperty[propertyName] = [];
    }
    tenantsByProperty[propertyName].push(tenant);
  });

  // Format timestamp for display
  const formatLastMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    // If message is from today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If message is from this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show date with year
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Tenants by Property</h2>
        <p className="text-sm text-gray-500">Select a tenant to view or start a conversation.</p>
      </div>

      {/* Property Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200">
        <button
          onClick={() => setSelectedPropertyId('all')}
          className={`px-4 py-2 text-sm font-medium ${
            selectedPropertyId === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        {properties.map((property: PropertyListItem) => (
          <button
            key={property.id}
            onClick={() => setSelectedPropertyId(property.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              selectedPropertyId === property.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {property.name}
          </button>
        ))}
      </div>

      {/* Tenant List */}
      <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
        {Object.entries(tenantsByProperty).length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No tenants found
          </div>
        ) : (
          Object.entries(tenantsByProperty).map(([propertyName, propertyTenants]: [string, TenantWithUI[]]) => (
            <div key={propertyName} className="divide-y divide-gray-100">
              <div className="px-4 py-3 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">{propertyName}</h3>
              </div>
              {propertyTenants.map((tenant: TenantWithUI) => (
                <button
                  key={tenant.id}
                  onClick={() => onSelectTenant(tenant)}
                  className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left ${
                    selectedTenant?.id === tenant.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="relative">
                    <Image
                      src={tenant.image || getInitialsAvatar(tenant.name)}
                      alt={tenant.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    {tenant.unreadCount && tenant.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {tenant.unreadCount > 9 ? '9+' : tenant.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{tenant.name}</h4>
                      {tenant.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatLastMessageTime(tenant.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {tenant.phone && (
                      <p className="text-xs text-gray-500 mt-0.5">{tenant.phone}</p>
                    )}
                    {tenant.lastMessage && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {tenant.lastMessage.text}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 