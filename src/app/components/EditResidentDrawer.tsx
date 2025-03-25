import { useState, useEffect } from 'react';
import { BaseDrawer } from './BaseDrawer';

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  moveInDate: string;
  leaseEndDate: string;
  propertyId: string;
  unitId?: string;
  rentAmount: number;
  depositAmount: number;
  status: 'active' | 'inactive' | 'pending';
  documents?: string[];
  notes?: string;
}

interface EditResidentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident | null;
  onSave: (updatedResident: Resident) => void;
  properties: { id: string; name: string }[];
}

export const EditResidentDrawer: React.FC<EditResidentDrawerProps> = ({
  isOpen,
  onClose,
  resident,
  onSave,
  properties = []
}) => {
  const [formData, setFormData] = useState<Resident | null>(resident);
  
  // Update form data when resident prop changes
  useEffect(() => {
    setFormData(resident);
  }, [resident]);

  if (!formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => prev ? {
        ...prev,
        [name]: parseFloat(value)
      } : null);
    } else {
      setFormData(prev => prev ? {
        ...prev,
        [name]: value
      } : null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Resident"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">
              Move-in Date
            </label>
            <input
              type="date"
              name="moveInDate"
              id="moveInDate"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.moveInDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="leaseEndDate" className="block text-sm font-medium text-gray-700">
              Lease End Date
            </label>
            <input
              type="date"
              name="leaseEndDate"
              id="leaseEndDate"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.leaseEndDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
            Property
          </label>
          <select
            id="propertyId"
            name="propertyId"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.propertyId}
            onChange={handleChange}
            required
          >
            <option value="">Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">
              Rent Amount
            </label>
            <input
              type="number"
              name="rentAmount"
              id="rentAmount"
              min="0"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.rentAmount}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700">
              Deposit Amount
            </label>
            <input
              type="number"
              name="depositAmount"
              id="depositAmount"
              min="0"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.depositAmount}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.notes || ''}
            onChange={handleChange}
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
          >
            Save Changes
          </button>
        </div>
      </form>
    </BaseDrawer>
  );
}; 