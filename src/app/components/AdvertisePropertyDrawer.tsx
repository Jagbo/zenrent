import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";

interface AdvertisePropertyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName?: string;
}

// Define the listing form data structure
interface ListingFormData {
  title: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  availableDate: string;
  propertyType: string;
  furnishingStatus: string;
  features: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export const AdvertisePropertyDrawer: React.FC<
  AdvertisePropertyDrawerProps
> = ({ isOpen, onClose, propertyName }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<ListingFormData>({
    title: propertyName || "",
    description: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    availableDate: "",
    propertyType: "apartment",
    furnishingStatus: "unfurnished",
    features: [],
    contactName: "",
    contactEmail: "",
    contactPhone: "",
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

  const handleCheckboxChange = (feature: string) => {
    setFormData((prev) => {
      const updatedFeatures = prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature];

      return {
        ...prev,
        features: updatedFeatures,
      };
    });
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating listings on all platforms");
    console.log("Listing details:", formData);
    // Add logic to create listings
    onClose();
    // Reset form state
    setStep(1);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <BaseDrawer isOpen={isOpen}
      onClose={() => {
        onClose();
        setStep(1);
      }}
      title="Advertise Property"
    >
      {step === 1 ? (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            We will advertise your property on these platforms
          </h3>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 font-bold">RM</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">Rightmove</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    UK's largest property portal
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-purple-600 font-bold">ZP</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">Zoopla</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Comprehensive property search
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-red-100 rounded-md flex items-center justify-center">
                  <span className="text-red-600 font-bold">OM</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">OnTheMarket</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Growing property portal
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleNext}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Enter listing details
          </h3>

          <div>
            <label htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Listing Title
            </label>
            <input type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
              placeholder="e.g., Beautiful 2-bed apartment in Manchester"
            />
          </div>

          <div>
            <label htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea name="description"
              id="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
              placeholder="Describe the property in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Price (£)
              </label>
              <input type="text"
                name="price"
                id="price"
                required
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
                placeholder="e.g., 1500"
              />
            </div>

            <div>
              <label htmlFor="availableDate"
                className="block text-sm font-medium text-gray-700"
              >
                Available From
              </label>
              <input type="date"
                name="availableDate"
                id="availableDate"
                required
                value={formData.availableDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="bedrooms"
                className="block text-sm font-medium text-gray-700"
              >
                Bedrooms
              </label>
              <input type="number"
                name="bedrooms"
                id="bedrooms"
                required
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="bathrooms"
                className="block text-sm font-medium text-gray-700"
              >
                Bathrooms
              </label>
              <input type="number"
                name="bathrooms"
                id="bathrooms"
                required
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="squareFeet"
                className="block text-sm font-medium text-gray-700"
              >
                Square Feet
              </label>
              <input type="number"
                name="squareFeet"
                id="squareFeet"
                required
                value={formData.squareFeet}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyType"
                className="block text-sm font-medium text-gray-700"
              >
                Property Type
              </label>
              <select name="propertyType"
                id="propertyType"
                required
                value={formData.propertyType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="flat">Flat</option>
                <option value="detached">Detached</option>
                <option value="semi-detached">Semi-Detached</option>
                <option value="terraced">Terraced</option>
              </select>
            </div>

            <div>
              <label htmlFor="furnishingStatus"
                className="block text-sm font-medium text-gray-700"
              >
                Furnishing
              </label>
              <select name="furnishingStatus"
                id="furnishingStatus"
                required
                value={formData.furnishingStatus}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
              >
                <option value="unfurnished">Unfurnished</option>
                <option value="furnished">Furnished</option>
                <option value="part-furnished">Part Furnished</option>
              </select>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Features (select all that apply)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Parking",
                "Garden",
                "Balcony",
                "Pets Allowed",
                "Bills Included",
                "Washing Machine",
                "Dishwasher",
                "Central Heating",
              ].map((feature) => (
                <div key={feature} className="flex items-center">
                  <input type="checkbox"
                    id={`feature-${feature}`}
                    checked={formData.features.includes(feature)}
                    onChange={() => handleCheckboxChange(feature)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`feature-${feature}`}
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {feature}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="contactName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contact Name
                </label>
                <input type="text"
                  name="contactName"
                  id="contactName"
                  required
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input type="email"
                    name="contactEmail"
                    id="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone
                  </label>
                  <input type="tel"
                    name="contactPhone"
                    id="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between space-x-4">
            <button type="button"
              onClick={handleBack}
              className="w-1/2 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>

            <button type="submit"
              className="w-1/2 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
            >
              Create Listings
            </button>
          </div>
        </form>
      )}
    </BaseDrawer>
  );
};
