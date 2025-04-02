'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getProperties, IProperty } from '@/lib/propertyService'
import { useAuth } from '@/lib/auth-provider'

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function PropertiesList() {
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<IProperty[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    fetchProperties()
  }, [user])

  async function fetchProperties() {
    try {
      setLoading(true)
      const data = await getProperties(user!.id)
      setProperties(data)
    } catch (error) {
      console.error('Error fetching properties:', error)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <p className="text-gray-600">Please sign in to view your properties.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Your Properties</h2>
      
      <div>
        {loading ? (
          <p className="text-gray-600">Loading properties...</p>
        ) : properties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No properties found.</p>
            <p className="text-sm text-gray-500 mt-2">Add your first property to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property: IProperty) => (
              <div key={property.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                {property.photo_url && (
                  <img 
                    src={property.photo_url} 
                    alt={property.address}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="font-semibold text-lg mb-2">{property.address}</h3>
                <div className="text-sm text-gray-600">
                  <p>{property.city}, {property.postcode}</p>
                  <p className="mt-1">{property.property_type} • {property.bedrooms} bed • {property.bathrooms} bath</p>
                  {property.is_furnished && <p className="mt-1">Furnished</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {property.has_garden && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Garden</span>
                    )}
                    {property.has_parking && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Parking</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 