import { useState } from 'react';
import { PropertyFormDrawer } from './PropertyFormDrawer';

// Define property form state interface to match the one in PropertyFormDrawer
interface PropertyFormState {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  rentAmount: string;
  description: string;
  amenities: string;
  yearBuilt: string;
  parkingSpots: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rentAmount: number;
  description: string;
  amenities: string[];
  yearBuilt: number;
  parkingSpots: number;
}

interface EditPropertyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSave: (updatedProperty: any) => void;
}

export const EditPropertyDrawer: React.FC<EditPropertyDrawerProps> = ({
  isOpen,
  onClose,
  property,
  onSave
}) => {
  // Format property data for the form
  const formatPropertyForForm = (property: Property | null): Partial<PropertyFormState> => {
    if (!property) return {};
    
    return {
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      type: property.type,
      status: property.status,
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      squareFeet: property.squareFeet.toString(),
      rentAmount: property.rentAmount.toString(),
      description: property.description,
      amenities: property.amenities.join(', '),
      yearBuilt: property.yearBuilt.toString(),
      parkingSpots: property.parkingSpots.toString()
    };
  };

  const handleSubmit = (formData: PropertyFormState) => {
    // Format form data back to property structure
    const updatedProperty = {
      ...property,
      ...formData,
      // Convert string fields back to numbers
      bedrooms: parseInt(formData.bedrooms, 10),
      bathrooms: parseInt(formData.bathrooms, 10),
      squareFeet: parseInt(formData.squareFeet, 10),
      rentAmount: parseInt(formData.rentAmount, 10),
      yearBuilt: parseInt(formData.yearBuilt, 10),
      parkingSpots: parseInt(formData.parkingSpots, 10),
      // Convert string amenities back to array
      amenities: typeof formData.amenities === 'string' 
        ? formData.amenities.split(',').map((item: string) => item.trim())
        : formData.amenities
    };
    
    onSave(updatedProperty);
    onClose();
  };

  return (
    <PropertyFormDrawer
      isOpen={isOpen && property !== null}
      onClose={onClose}
      initialData={formatPropertyForForm(property)}
      onSubmit={handleSubmit}
      title={`Edit Property: ${property?.name || ''}`}
    />
  );
}; 