'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useUser } from '@/lib/hooks/use-user'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { getProperties, IProperty } from '@/lib/propertyService'
import { PlaidLink } from '@/components/plaid/PlaidLink'
import { toast } from 'react-hot-toast'

interface BankAccountDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function BankAccountDrawer({ isOpen, onClose }: BankAccountDrawerProps) {
  const [properties, setProperties] = useState<IProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [linkToken, setLinkToken] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPlaidOpen, setIsPlaidOpen] = useState(false)
  const { user, loading: userLoading } = useUser()

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setLinkToken('')
      setSelectedProperties([])
      setIsPlaidOpen(false)
    }
  }, [isOpen])

  // Handle drawer close attempt
  const handleCloseAttempt = () => {
    if (isPlaidOpen) {
      // Prevent closing if Plaid is open
      return
    }
    onClose()
  }

  // Fetch properties when drawer opens and user is loaded
  useEffect(() => {
    let isMounted = true

    async function fetchProperties() {
      if (!user) return

      try {
        setLoading(true)
        const propertiesData = await getProperties(user.id)
        if (isMounted) {
          console.log('Fetched properties:', propertiesData)
          setProperties(propertiesData || [])
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
        toast.error('Failed to fetch properties')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (isOpen && !userLoading) {
      fetchProperties()
    }

    return () => {
      isMounted = false
    }
  }, [isOpen, userLoading, user?.id])

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId)
      } else {
        return [...prev, propertyId]
      }
    })
  }

  const handleConnect = async () => {
    if (!user || selectedProperties.length === 0) return

    try {
      setIsConnecting(true)
      console.log('Requesting link token...')
      
      // Get a link token from our backend
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country_codes: ['GB'],
          language: 'en',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to get link token:', errorData)
        throw new Error(errorData.error || 'Failed to get link token')
      }

      const data = await response.json()
      console.log('Received link token response:', data)
      
      if (!data.link_token) {
        throw new Error('No link token received from server')
      }
      
      setLinkToken(data.link_token)
      console.log('Link token set successfully')
    } catch (error: any) {
      console.error('Error getting link token:', error)
      toast.error(error.message || 'Failed to initialize bank connection')
      setLinkToken('') // Reset link token on error
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    console.log('Plaid success callback triggered', { metadata })
    try {
      setIsConnecting(true)
      setIsPlaidOpen(false)
      
      console.log('Exchanging public token...')
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: publicToken,
          metadata: {
            properties: selectedProperties,
            ...metadata,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Token exchange failed:', errorData)
        throw new Error(errorData.error || 'Failed to exchange token')
      }

      const data = await response.json()
      console.log('Token exchange successful:', data)

      toast.success('Bank account connected successfully')
      onClose()
    } catch (error: any) {
      console.error('Error exchanging public token:', error)
      toast.error(error.message || 'Failed to complete bank connection')
    } finally {
      setIsConnecting(false)
      setLinkToken('')
    }
  }

  const handlePlaidExit = () => {
    console.log('Plaid Link closed')
    setIsPlaidOpen(false)
    setLinkToken('')
  }

  const handlePlaidOpen = () => {
    console.log('Plaid Link opened')
    setIsPlaidOpen(true)
  }

  if (userLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!user) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500">Please sign in to connect bank accounts.</p>
            <Button className="mt-4" onClick={onClose}>Close</Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleCloseAttempt}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Connect Bank Account</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Select your properties to connect
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No properties found. Please add properties to your account first.
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <Checkbox
                    id={property.id}
                    checked={selectedProperties.includes(property.id)}
                    onCheckedChange={() => handlePropertySelect(property.id)}
                  />
                  <label
                    htmlFor={property.id}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <div className="font-medium">{property.name || property.address}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {property.address}
                      {property.city && `, ${property.city}`}
                      {property.postcode && `, ${property.postcode}`}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isPlaidOpen}
            >
              Cancel
            </Button>
            
            {linkToken ? (
              <PlaidLink
                linkToken={linkToken}
                onSuccess={handlePlaidSuccess}
                onExit={handlePlaidExit}
                onOpen={handlePlaidOpen} 
              />
            ) : (
              <Button
                onClick={() => {
                  console.log("Connect Selected button clicked"); 
                  handleConnect();
                }}
                disabled={selectedProperties.length === 0 || loading || isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Selected'
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 