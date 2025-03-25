import { useState } from 'react'
import { BaseDrawer } from './BaseDrawer'

// Define property form state type
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

interface PropertyFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<PropertyFormState>;
  onSubmit: (data: PropertyFormState) => void;
  title?: string;
}

export const PropertyFormDrawer: React.FC<PropertyFormDrawerProps> = ({ 
  isOpen, 
  onClose, 
  initialData = {}, 
  onSubmit,
  title = 'Add Property' 
}) => {
  const [formData, setFormData] = useState<PropertyFormState>({
    name: initialData.name || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    type: initialData.type || 'HMO',
    status: initialData.status || 'available',
    bedrooms: initialData.bedrooms || '',
    bathrooms: initialData.bathrooms || '',
    squareFeet: initialData.squareFeet || '',
    rentAmount: initialData.rentAmount || '',
    description: initialData.description || '',
    amenities: initialData.amenities || '',
    yearBuilt: initialData.yearBuilt || '',
    parkingSpots: initialData.parkingSpots || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-900">
            Property Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            placeholder="e.g., Sunset Apartments"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-900">
            Street Address
          </label>
          <input
            type="text"
            name="address"
            id="address"
            required
            value={formData.address}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-900">
              City
            </label>
            <input
              type="text"
              name="city"
              id="city"
              required
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-900">
              State
            </label>
            <input
              type="text"
              name="state"
              id="state"
              required
              value={formData.state}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-900">
            Post Code
          </label>
          <input
            type="text"
            name="zipCode"
            id="zipCode"
            required
            value={formData.zipCode}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-900">
            Property Type
          </label>
          <select
            name="type"
            id="type"
            required
            value={formData.type}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
          >
            <option value="HMO">HMO</option>
            <option value="Flat">Flat</option>
            <option value="House">House</option>
            <option value="Studio">Studio</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-900">
              Bedrooms
            </label>
            <input
              type="number"
              name="bedrooms"
              id="bedrooms"
              required
              value={formData.bedrooms}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-900">
              Bathrooms
            </label>
            <input
              type="number"
              name="bathrooms"
              id="bathrooms"
              required
              value={formData.bathrooms}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-900">
              Square Feet
            </label>
            <input
              type="number"
              name="squareFeet"
              id="squareFeet"
              required
              value={formData.squareFeet}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-900">
              Monthly Rent (£)
            </label>
            <input
              type="number"
              name="rentAmount"
              id="rentAmount"
              required
              value={formData.rentAmount}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-900">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            placeholder="Property description and additional details..."
          />
        </div>

        <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none sm:text-sm"
          >
            Save
          </button>
        </div>
      </form>
    </BaseDrawer>
  );
}; 