'use client'

import { useState } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { WhatsAppBusinessDrawer } from './WhatsAppBusinessDrawer'

interface WhatsAppConnectionStatusProps {
  isConnected: boolean
  phoneNumber?: string
}

export function WhatsAppConnectionStatus({
  isConnected,
  phoneNumber
}: WhatsAppConnectionStatusProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          )}
          <h3 className="text-base font-medium">WhatsApp Business</h3>
        </div>
        
        {isConnected ? (
          <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
            Connected
          </span>
        ) : (
          <span className="text-sm font-medium text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
            Not Connected
          </span>
        )}
      </div>
      
      <div className="mt-2">
        {isConnected ? (
          <div>
            <p className="text-sm text-gray-600">
              Your WhatsApp Business account is connected and ready to use.
            </p>
            {phoneNumber && (
              <p className="text-sm text-gray-600 mt-1">
                Phone: {phoneNumber}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Connect your WhatsApp Business account to send messages to your tenants.
          </p>
        )}
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`text-sm font-medium px-4 py-2 rounded-md w-full ${
            isConnected
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isConnected ? 'Manage Connection' : 'Connect WhatsApp'}
        </button>
      </div>
      
      <WhatsAppBusinessDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
} 