import { useState } from 'react';
import { BaseDrawer } from './BaseDrawer';

interface ResidentFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyId: string;
  unitNumber: string;
  leaseStartDate: string;
  leaseEndDate: string;
  rentAmount: string;
  securityDeposit: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  occupants: string;
  pets: string;
  vehicleInfo: string;
  moveInDate: string;
  status: 'active' | 'inactive' | 'pending';
  paymentMethod: string;
  notes: string;
}

interface ResidentFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResidentFormState) => void;
  initialData?: Partial<ResidentFormState>;
  properties?: { id: string; name: string }[];
  title?: string;
}

export const ResidentFormDrawer: React.FC<ResidentFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  properties = [],
  title = 'Add Resident'
}) => {
  const [formData, setFormData] = useState<ResidentFormState>({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    propertyId: initialData.propertyId || '',
    unitNumber: initialData.unitNumber || '',
    leaseStartDate: initialData.leaseStartDate || '',
    leaseEndDate: initialData.leaseEndDate || '',
    rentAmount: initialData.rentAmount || '',
    securityDeposit: initialData.securityDeposit || '',
    emergencyContactName: initialData.emergencyContactName || '',
    emergencyContactPhone: initialData.emergencyContactPhone || '',
    occupants: initialData.occupants || '',
    pets: initialData.pets || '',
    vehicleInfo: initialData.vehicleInfo || '',
    moveInDate: initialData.moveInDate || '',
    status: initialData.status || 'active',
    paymentMethod: initialData.paymentMethod || 'bank_transfer',
    notes: initialData.notes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      width="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                type="tel"
                name="phone"
                id="phone"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Property Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
                Property
              </label>
              <select
                id="propertyId"
                name="propertyId"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.propertyId}
                onChange={handleChange}
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700">
                Unit Number
              </label>
              <input
                type="text"
                name="unitNumber"
                id="unitNumber"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.unitNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Lease Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Lease Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="leaseStartDate" className="block text-sm font-medium text-gray-700">
                Lease Start Date
              </label>
              <input
                type="date"
                name="leaseStartDate"
                id="leaseStartDate"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.leaseStartDate}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">
                Move-in Date
              </label>
              <input
                type="date"
                name="moveInDate"
                id="moveInDate"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.moveInDate}
                onChange={handleChange}
              />
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
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">
                Monthly Rent (£)
              </label>
              <input
                type="number"
                name="rentAmount"
                id="rentAmount"
                required
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.rentAmount}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700">
                Security Deposit (£)
              </label>
              <input
                type="number"
                name="securityDeposit"
                id="securityDeposit"
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.securityDeposit}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
              Preferred Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="direct_debit">Direct Debit</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </select>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="emergencyContactName"
                id="emergencyContactName"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="emergencyContactPhone"
                id="emergencyContactPhone"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="occupants" className="block text-sm font-medium text-gray-700">
                Additional Occupants
              </label>
              <input
                type="text"
                name="occupants"
                id="occupants"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.occupants}
                onChange={handleChange}
                placeholder="Names and ages"
              />
            </div>
            <div>
              <label htmlFor="pets" className="block text-sm font-medium text-gray-700">
                Pets
              </label>
              <input
                type="text"
                name="pets"
                id="pets"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.pets}
                onChange={handleChange}
                placeholder="Type, breed, and number"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="vehicleInfo" className="block text-sm font-medium text-gray-700">
              Vehicle Information
            </label>
            <input
              type="text"
              name="vehicleInfo"
              id="vehicleInfo"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.vehicleInfo}
              onChange={handleChange}
              placeholder="Make, model, year, and plate number"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information or special requirements"
            />
          </div>
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
            {initialData.firstName ? 'Update Resident' : 'Add Resident'}
          </button>
        </div>
      </form>
    </BaseDrawer>
  );
}; 