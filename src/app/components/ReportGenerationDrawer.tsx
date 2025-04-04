import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";

interface ReportGenerationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportConfig: ReportConfig) => void;
}

interface ReportConfig {
  reportType: "financial" | "occupancy" | "maintenance" | "custom";
  dateRange:
    | "last30days"
    | "last3months"
    | "last6months"
    | "lastYear"
    | "custom";
  customStartDate?: string;
  customEndDate?: string;
  properties: string[];
  includeGraphs: boolean;
  includeTables: boolean;
  format: "pdf" | "csv" | "excel";
  recipients: string[];
  schedule?: "once" | "daily" | "weekly" | "monthly";
}

export const ReportGenerationDrawer: React.FC<ReportGenerationDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportType: "financial",
    dateRange: "last30days",
    properties: [],
    includeGraphs: true,
    includeTables: true,
    format: "pdf",
    recipients: [],
    schedule: "once",
  });
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [availableProperties, setAvailableProperties] = useState([
    { id: "prop1", name: "123 Main St" },
    { id: "prop2", name: "456 Oak Ave" },
    { id: "prop3", name: "789 Pine Rd" },
    { id: "prop4", name: "321 Cedar Ln" },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setReportConfig((prev) => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else {
      setReportConfig((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === "dateRange") {
        setShowCustomDateRange(value === "custom");
      }
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    setReportConfig((prev) => {
      if (prev.properties.includes(propertyId)) {
        return {
          ...prev,
          properties: prev.properties.filter((id) => id !== propertyId),
        };
      } else {
        return {
          ...prev,
          properties: [...prev.properties, propertyId],
        };
      }
    });
  };

  const handleAddRecipient = () => {
    if (
      newRecipient.trim() &&
      !reportConfig.recipients.includes(newRecipient.trim())
    ) {
      setReportConfig((prev) => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient.trim()],
      }));
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setReportConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reportConfig);
  };

  return (
    <BaseDrawer isOpen={isOpen}
      onClose={onClose}
      title="Generate Report"
      width="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="reportType"
            className="block text-sm font-medium text-gray-700"
          >
            Report Type
          </label>
          <select id="reportType"
            name="reportType"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
            value={reportConfig.reportType}
            onChange={handleChange}
          >
            <option value="financial">Financial Report</option>
            <option value="occupancy">Occupancy Report</option>
            <option value="maintenance">Maintenance Report</option>
            <option value="custom">Custom Report</option>
          </select>
        </div>

        <div>
          <label htmlFor="dateRange"
            className="block text-sm font-medium text-gray-700"
          >
            Date Range
          </label>
          <select id="dateRange"
            name="dateRange"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
            value={reportConfig.dateRange}
            onChange={handleChange}
          >
            <option value="last30days">Last 30 Days</option>
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="lastYear">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {showCustomDateRange && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="customStartDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input type="date"
                id="customStartDate"
                name="customStartDate"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
                value={reportConfig.customStartDate || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="customEndDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input type="date"
                id="customEndDate"
                name="customEndDate"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
                value={reportConfig.customEndDate || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Properties
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
            {availableProperties.map((property) => (
              <div key={property.id} className="flex items-center mb-2">
                <input id={`property-${property.id}`}
                  type="checkbox"
                  className="h-4 w-4 text-gray-900 focus:ring-[#D9E8FF]/80 border-gray-300 rounded"
                  checked={reportConfig.properties.includes(property.id)}
                  onChange={() => handlePropertyToggle(property.id)}
                />
                <label htmlFor={`property-${property.id}`}
                  className="ml-2 block text-sm text-gray-900"
                >
                  {property.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <input id="includeGraphs"
              name="includeGraphs"
              type="checkbox"
              className="h-4 w-4 text-gray-900 focus:ring-[#D9E8FF]/80 border-gray-300 rounded"
              checked={reportConfig.includeGraphs}
              onChange={handleChange}
            />
            <label htmlFor="includeGraphs"
              className="ml-2 block text-sm text-gray-900"
            >
              Include Graphs
            </label>
          </div>

          <div className="flex items-center">
            <input id="includeTables"
              name="includeTables"
              type="checkbox"
              className="h-4 w-4 text-gray-900 focus:ring-[#D9E8FF]/80 border-gray-300 rounded"
              checked={reportConfig.includeTables}
              onChange={handleChange}
            />
            <label htmlFor="includeTables"
              className="ml-2 block text-sm text-gray-900"
            >
              Include Tables
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="format"
            className="block text-sm font-medium text-gray-700"
          >
            Format
          </label>
          <select id="format"
            name="format"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
            value={reportConfig.format}
            onChange={handleChange}
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div>
          <label htmlFor="recipients"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Recipients
          </label>
          <div className="flex">
            <input type="email"
              id="newRecipient"
              name="newRecipient"
              className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter email address"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
            />
            <button type="button"
              className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#D9E8FF] hover:bg-[#D9E8FF]/80 focus:outline-none"
              onClick={handleAddRecipient}
            >
              Add
            </button>
          </div>
          {reportConfig.recipients.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
              {reportConfig.recipients.map((email, index) => (
                <li key={index}
                  className="px-4 py-2 flex justify-between items-center bg-white"
                >
                  <span className="text-sm text-gray-900">{email}</span>
                  <button type="button"
                    className="text-sm text-red-600 hover:text-red-900"
                    onClick={() => handleRemoveRecipient(email)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="schedule"
            className="block text-sm font-medium text-gray-700"
          >
            Schedule
          </label>
          <select id="schedule"
            name="schedule"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
            value={reportConfig.schedule}
            onChange={handleChange}
          >
            <option value="once">Run Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex space-x-3">
          <button type="button"
            className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit"
            className="flex-1 bg-[#D9E8FF] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#D9E8FF]/80 focus:outline-none"
          >
            Generate Report
          </button>
        </div>
      </form>
    </BaseDrawer>
  );
};
