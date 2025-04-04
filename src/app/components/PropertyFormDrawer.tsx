import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";

// Define property form state type
export interface PropertyFormState {
  address: string;
  city: string;
  postcode: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  description?: string;
  is_furnished?: boolean;
  has_garden?: boolean;
  has_parking?: boolean;
  energy_rating?: string;
  council_tax_band?: string;
  notes?: string;
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
  title = "Add Property",
}) => {
  const [formData, setFormData] = useState<PropertyFormState>({
    address: initialData.address || "",
    city: initialData.city || "",
    postcode: initialData.postcode || "",
    property_type: initialData.property_type || "HMO",
    bedrooms: initialData.bedrooms || "",
    bathrooms: initialData.bathrooms || "",
    description: initialData.description || "",
    is_furnished: initialData.is_furnished || false,
    has_garden: initialData.has_garden || false,
    has_parking: initialData.has_parking || false,
    energy_rating: initialData.energy_rating || "",
    council_tax_band: initialData.council_tax_band || "",
    notes: initialData.notes || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <BaseDrawer isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="address"
            className="block text-sm font-medium text-gray-900"
          >
            Street Address
          </label>
          <input type="text"
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
            <label htmlFor="city"
              className="block text-sm font-medium text-gray-900"
            >
              City
            </label>
            <input type="text"
              name="city"
              id="city"
              required
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="postcode"
              className="block text-sm font-medium text-gray-900"
            >
              Post Code
            </label>
            <input type="text"
              name="postcode"
              id="postcode"
              required
              value={formData.postcode}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="property_type"
            className="block text-sm font-medium text-gray-900"
          >
            Property Type
          </label>
          <select name="property_type"
            id="property_type"
            required
            value={formData.property_type}
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
            <label htmlFor="bedrooms"
              className="block text-sm font-medium text-gray-900"
            >
              Bedrooms
            </label>
            <input type="number"
              name="bedrooms"
              id="bedrooms"
              required
              value={formData.bedrooms}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="bathrooms"
              className="block text-sm font-medium text-gray-900"
            >
              Bathrooms
            </label>
            <input type="number"
              name="bathrooms"
              id="bathrooms"
              required
              value={formData.bathrooms}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description"
            className="block text-sm font-medium text-gray-900"
          >
            Description
          </label>
          <textarea name="description"
            id="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            placeholder="Property description and additional details..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="energy_rating"
              className="block text-sm font-medium text-gray-900"
            >
              Energy Rating
            </label>
            <input type="text"
              name="energy_rating"
              id="energy_rating"
              value={formData.energy_rating}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="council_tax_band"
              className="block text-sm font-medium text-gray-900"
            >
              Council Tax Band
            </label>
            <input type="text"
              name="council_tax_band"
              id="council_tax_band"
              value={formData.council_tax_band}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center">
            <input type="checkbox"
              name="is_furnished"
              id="is_furnished"
              checked={formData.is_furnished}
              onChange={(e) =>
                handleInputChange({
                  target: {
                    name: "is_furnished",
                    value: e.target.checked,
                  },
                } as any)
              }
              className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
            />
            <label htmlFor="is_furnished"
              className="ml-2 block text-sm text-gray-900"
            >
              Furnished
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox"
              name="has_garden"
              id="has_garden"
              checked={formData.has_garden}
              onChange={(e) =>
                handleInputChange({
                  target: {
                    name: "has_garden",
                    value: e.target.checked,
                  },
                } as any)
              }
              className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
            />
            <label htmlFor="has_garden"
              className="ml-2 block text-sm text-gray-900"
            >
              Garden
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox"
              name="has_parking"
              id="has_parking"
              checked={formData.has_parking}
              onChange={(e) =>
                handleInputChange({
                  target: {
                    name: "has_parking",
                    value: e.target.checked,
                  },
                } as any)
              }
              className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
            />
            <label htmlFor="has_parking"
              className="ml-2 block text-sm text-gray-900"
            >
              Parking
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="notes"
            className="block text-sm font-medium text-gray-900"
          >
            Notes
          </label>
          <textarea name="notes"
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            placeholder="Additional notes about the property..."
          />
        </div>

        <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
          <button type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
          >
            Cancel
          </button>
          <button type="submit"
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none sm:text-sm"
          >
            Save
          </button>
        </div>
      </form>
    </BaseDrawer>
  );
};
