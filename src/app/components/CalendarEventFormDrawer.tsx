import { useState } from 'react';
import { BaseDrawer } from './BaseDrawer';

interface CalendarEventFormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'inspection' | 'payment' | 'maintenance' | 'meeting' | 'showing' | 'contract' | 'admin';
  description: string;
}

interface CalendarEventFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CalendarEventFormState) => void;
  initialData?: Partial<CalendarEventFormState>;
  title?: string;
  selectedEvent?: any; // For viewing mode
}

export const CalendarEventFormDrawer: React.FC<CalendarEventFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  title = 'Add Event',
  selectedEvent = null
}) => {
  const [formData, setFormData] = useState<CalendarEventFormState>({
    title: initialData.title || '',
    date: initialData.date || '',
    startTime: initialData.startTime || '',
    endTime: initialData.endTime || '',
    location: initialData.location || '',
    type: initialData.type || 'meeting',
    description: initialData.description || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Function to get the appropriate color for each event type
  const getEventColor = (type: string): string => {
    const colors = {
      inspection: 'bg-purple-100 text-purple-800',
      payment: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      meeting: 'bg-blue-100 text-blue-800',
      showing: 'bg-pink-100 text-pink-800',
      contract: 'bg-[#D9E8FF]/10 text-indigo-800',
      admin: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.admin;
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedEvent ? selectedEvent.title : title}
      width="md"
    >
      {selectedEvent ? (
        // Event details view
        <div className="py-6">
          <div className={`${getEventColor(selectedEvent.type)} px-3 py-1 inline-block rounded-full text-sm font-medium mb-4`}>
            {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <div className="mt-1 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {selectedEvent.date} | {selectedEvent.startTime} - {selectedEvent.endTime}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <div className="mt-1 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {selectedEvent.location}
              </div>
            </div>
            
            {selectedEvent.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-700">{selectedEvent.description}</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Add/Edit event form
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Event Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name="date"
              id="date"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                id="startTime"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                id="endTime"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Event Type
            </label>
            <select
              name="type"
              id="type"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="inspection">Inspection</option>
              <option value="payment">Payment</option>
              <option value="maintenance">Maintenance</option>
              <option value="meeting">Meeting</option>
              <option value="showing">Showing</option>
              <option value="contract">Contract</option>
              <option value="admin">Administrative</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#D9E8FF]/80 focus:border-indigo-500 sm:text-sm"
              value={formData.description}
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
              className="flex-1 bg-[#D9E8FF] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#D9E8FF]/80 focus:outline-none"
            >
              {initialData.title ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      )}
    </BaseDrawer>
  );
}; 