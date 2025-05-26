"use client";

import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface HmrcConnectionStatusProps {
  status: ConnectionStatus;
  errorMessage?: string;
  lastConnected?: string;
  onConnect?: () => void;
}

export function HmrcConnectionStatus({ 
  status, 
  errorMessage, 
  lastConnected,
  onConnect
}: HmrcConnectionStatusProps) {
  return (
    <div className="bg-white shadow sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">HMRC Connection Status</h3>
        
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            Making Tax Digital requires a secure connection to HMRC's APIs.
          </p>
        </div>
        
        <div className="mt-3 flex items-center">
          {status === 'connected' && (
            <>
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-700">Connected to HMRC</span>
              {lastConnected && (
                <span className="ml-2 text-xs text-gray-500">
                  Last verified: {new Date(lastConnected).toLocaleString()}
                </span>
              )}
            </>
          )}
          
          {status === 'disconnected' && (
            <>
              <XCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Not connected to HMRC</span>
              
              {onConnect && (
                <button
                  type="button"
                  onClick={onConnect}
                  className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Connect
                </button>
              )}
            </>
          )}
          
          {status === 'connecting' && (
            <>
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-700">Connecting to HMRC...</span>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-700">
                Connection error
                {errorMessage && (
                  <span className="ml-1">: {errorMessage}</span>
                )}
              </span>
              
              {onConnect && (
                <button
                  type="button"
                  onClick={onConnect}
                  className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Try Again
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
