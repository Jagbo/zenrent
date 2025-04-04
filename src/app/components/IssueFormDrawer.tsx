"use client";

import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { supabase } from "@/lib/supabase";
import { getIssueCategories } from "@/lib/issueService";

// Define property options for the form
const properties = [
  { id: "123-main", name: "123 Main Street" },
  { id: "456-park", name: "456 Park Avenue" },
  { id: "789-ocean", name: "789 Ocean Drive" },
  { id: "321-victoria", name: "321 Victoria Road" },
  { id: "654-royal", name: "654 Royal Crescent" },
  { id: "987-kings", name: "987 Kings Road" },
];

// Define assignee options
const assignees = [
  { id: "JS", name: "John Smith" },
  { id: "RW", name: "Robert Williams" },
  { id: "SJ", name: "Sarah Johnson" },
  { id: "MA", name: "Michael Adams" },
];

interface Property {
  id: string;
  address: string;
}

interface Contractor {
  id: string;
  name: string;
}

interface IssueCategory {
  id: string;
  name: string;
}

interface IssueFormData {
  title: string;
  description: string;
  propertyId: string;
  category: string;
  priority: string;
  reportedBy: string;
  assignedTo: string;
  dueDate: string;
  attachments?: File[];
}

interface IssueFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: IssueFormData) => void;
  initialData?: Partial<IssueFormData>;
  title?: string;
  preSelectedPropertyId?: string;
  propertyName?: string;
}

export const IssueFormDrawer: React.FC<IssueFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  title = "Create New Issue",
  preSelectedPropertyId,
  propertyName,
}) => {
  const drawerTitle = propertyName ? `Report Issue: ${propertyName}` : title;

  const [formData, setFormData] = useState<IssueFormData>({
    title: initialData.title || "",
    description: initialData.description || "",
    propertyId: preSelectedPropertyId || initialData.propertyId || "",
    category: initialData.category || "",
    priority: initialData.priority || "medium",
    reportedBy: initialData.reportedBy || "",
    assignedTo: initialData.assignedTo || "",
    dueDate: initialData.dueDate || "",
    attachments: initialData.attachments || [],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("id, address");

        if (propertiesError) throw propertiesError;
        setProperties(propertiesData || []);

        // Fetch contractors
        const { data: contractorsData, error: contractorsError } =
          await supabase.from("contractors").select("id, name").order("name");

        if (contractorsError) throw contractorsError;
        setContractors(contractorsData || []);

        // Fetch issue categories
        const categoriesData = await getIssueCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching form data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: IssueFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev: File[]) => [...prev, ...newFiles]);
      setFormData((prev: IssueFormData) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newFiles],
      }));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev: File[]) =>
      prev.filter((_: File, i: number) => i !== index),
    );
    setFormData((prev: IssueFormData) => ({
      ...prev,
      attachments:
        prev.attachments?.filter((_: File, i: number) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (isLoading) {
    return (
      <BaseDrawer isOpen={isOpen} onClose={onClose} title={drawerTitle}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </BaseDrawer>
    );
  }

  return (
    <BaseDrawer isOpen={isOpen} onClose={onClose} title={drawerTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title"
            className="block text-sm font-medium text-gray-900"
          >
            Issue Title
          </label>
          <input type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            placeholder="e.g., Water leak in bathroom"
          />
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
            required
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            placeholder="Describe the issue in detail..."
          />
        </div>

        <div>
          <label htmlFor="propertyId"
            className="block text-sm font-medium text-gray-900"
          >
            Property
          </label>
          <select name="propertyId"
            id="propertyId"
            required
            value={formData.propertyId}
            onChange={handleInputChange}
            disabled={!!preSelectedPropertyId}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
          >
            <option value="" disabled>
              Select a property
            </option>
            {properties.map((property: Property) => (
              <option key={property.id} value={property.id}>
                {property.address}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category"
              className="block text-sm font-medium text-gray-900"
            >
              Category
            </label>
            <select name="category"
              id="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category: IssueCategory) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority"
              className="block text-sm font-medium text-gray-900"
            >
              Priority
            </label>
            <select name="priority"
              id="priority"
              required
              value={formData.priority}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reportedBy"
              className="block text-sm font-medium text-gray-900"
            >
              Reported By
            </label>
            <input type="text"
              name="reportedBy"
              id="reportedBy"
              value={formData.reportedBy}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
              placeholder="e.g., Tenant name"
            />
          </div>
          <div>
            <label htmlFor="assignedTo"
              className="block text-sm font-medium text-gray-900"
            >
              Assigned To
            </label>
            <select name="assignedTo"
              id="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
            >
              <option value="">Unassigned</option>
              {contractors.map((contractor: Contractor) => (
                <option key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dueDate"
            className="block text-sm font-medium text-gray-900"
          >
            Due Date
          </label>
          <input type="date"
            name="dueDate"
            id="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">
            Attachments
          </label>
          <div className="mt-1 flex items-center">
            <label htmlFor="file-upload"
              className="cursor-pointer rounded-md bg-white py-2 px-3 border border-gray-300 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <span>Upload files</span>
              <input id="file-upload"
                name="file-upload"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>
          {files.length > 0 && (
            <ul className="mt-2 space-y-2">
              {files.map((file: File, index: number) => (
                <li key={index}
                  className="flex items-center justify-between rounded-md border border-gray-200 py-2 px-3"
                >
                  <span className="text-sm truncate">{file.name}</span>
                  <button type="button"
                    onClick={() => removeFile(index)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
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
