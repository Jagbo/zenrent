'use client'

import { useState } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarBody, 
  SidebarFooter, 
  SidebarItem 
} from '../components/sidebar'
import Link from 'next/link'
import Image from 'next/image'
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  ExclamationCircleIcon, 
  BanknotesIcon, 
  ShoppingBagIcon,
  CodeBracketIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  XMarkIcon
} from '@heroicons/react/24/solid'
import { SidebarContent } from '../components/sidebar-content'

// Icons for navigation items
function DashboardIcon() {
  return <HomeIcon className="w-5 h-5" />
}

function PropertiesIcon() {
  return <BuildingOfficeIcon className="w-5 h-5" />
}

function ResidentsIcon() {
  return <UsersIcon className="w-5 h-5" />
}

function CalendarIconComponent() {
  return <CalendarIcon className="w-5 h-5" />
}

function IssuesIcon() {
  return <ExclamationCircleIcon className="w-5 h-5" />
}

function FinancialIcon() {
  return <BanknotesIcon className="w-5 h-5" />
}

function SuppliersIcon() {
  return <ShoppingBagIcon className="w-5 h-5" />
}

function IntegrationsIcon() {
  return <CodeBracketIcon className="w-5 h-5" />
}

// Define calendar events for the demo
const events = [
  { id: 1, title: "Property Inspection", date: "2024-03-01", time: "10:00 AM - 11:00 AM", location: "Sunset Apartments Room 204", type: "inspection" },
  { id: 2, title: "Rent Due", date: "2024-03-04", time: "All day", location: "All properties", type: "payment" },
  { id: 3, title: "Maintenance Visit", date: "2024-03-08", time: "2:00 PM - 4:00 PM", location: "Oakwood Heights Room 103", type: "maintenance" },
  { id: 4, title: "Tenant Meeting", date: "2024-03-12", time: "3:00 PM - 3:30 PM", location: "Parkview Residences Room 305", type: "meeting" },
  { id: 5, title: "Property Showing", date: "2024-03-15", time: "11:00 AM - 12:00 PM", location: "Sunset Apartments Room 112", type: "showing" },
  { id: 6, title: "Lease Signing", date: "2024-03-18", time: "10:00 AM - 11:00 AM", location: "Main Office", type: "contract" },
  { id: 7, title: "Contractor Meeting", date: "2024-03-22", time: "9:00 AM - 10:00 AM", location: "Oakwood Heights", type: "maintenance" },
  { id: 8, title: "Monthly Report Due", date: "2024-03-31", time: "All day", location: "N/A", type: "admin" }
];

// Get background color based on event type
function getEventColor(type: string): string {
  switch (type) {
    case 'inspection': return 'bg-blue-100 text-blue-800';
    case 'payment': return 'bg-green-100 text-green-800';
    case 'maintenance': return 'bg-purple-100 text-purple-800';
    case 'meeting': return 'bg-red-100 text-red-800';
    case 'showing': return 'bg-yellow-100 text-yellow-800';
    case 'contract': return 'bg-indigo-100 text-indigo-800';
    case 'admin': return 'bg-gray-100 text-gray-800';
    default: return 'bg-blue-100 text-blue-800';
  }
}

export default function Calendar() {
  const [currentView, setCurrentView] = useState('month');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'meeting',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the event to your backend
    console.log('New event:', newEvent);
    setIsDrawerOpen(false);
    setNewEvent({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      type: 'meeting',
      description: ''
    });
  };

  // Render different views based on the current selection
  const renderCalendarView = () => {
    switch (currentView) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'list':
        return renderListView();
      default:
        return renderMonthView();
    }
  };

  // Render the month view (grid)
  const renderMonthView = () => {
    return (
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sun</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Mon</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tue</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Wed</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Thu</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fri</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sat</div>
            
            {/* Days from previous month */}
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">25</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">26</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">27</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">28</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">29</div>
            </div>
            
            {/* Days from current month */}
            <div className="bg-white h-32 p-2">
              <div className="text-sm">1</div>
              <div className="mt-1 text-xs p-1 bg-blue-100 text-blue-800 rounded">Property Inspection</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">2</div>
            </div>
            
            <div className="bg-white h-32 p-2">
              <div className="text-sm">3</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">4</div>
              <div className="mt-1 text-xs p-1 bg-green-100 text-green-800 rounded">Rent Due</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">5</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">6</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">7</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">8</div>
              <div className="mt-1 text-xs p-1 bg-purple-100 text-purple-800 rounded">Maintenance Visit</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">9</div>
            </div>
            
            {/* Current day highlight */}
            <div className="bg-white h-32 p-2 border-2 border-blue-500">
              <div className="text-sm font-bold">10</div>
            </div>
            
        {/* Remaining calendar cells */}
            <div className="bg-white h-32 p-2">
              <div className="text-sm">11</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">12</div>
              <div className="mt-1 text-xs p-1 bg-red-100 text-red-800 rounded">Tenant Meeting</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">13</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">14</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">15</div>
              <div className="mt-1 text-xs p-1 bg-yellow-100 text-yellow-800 rounded">Property Showing</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">16</div>
        </div>
        {/* Additional days would follow... */}
      </div>
    );
  };

  // Render the week view
  const renderWeekView = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 border-r border-gray-200"></div>
          <div className="p-3 text-center border-r border-gray-200">
            <div className="font-medium">Sun</div>
            <div className="text-gray-500">3</div>
          </div>
          <div className="p-3 text-center border-r border-gray-200">
            <div className="font-medium">Mon</div>
            <div className="text-gray-500">4</div>
          </div>
          <div className="p-3 text-center border-r border-gray-200">
            <div className="font-medium">Tue</div>
            <div className="text-gray-500">5</div>
          </div>
          <div className="p-3 text-center border-r border-gray-200">
            <div className="font-medium">Wed</div>
            <div className="text-gray-500">6</div>
          </div>
          <div className="p-3 text-center border-r border-gray-200">
            <div className="font-medium">Thu</div>
            <div className="text-gray-500">7</div>
          </div>
          <div className="p-3 text-center border-r border-gray-200">
            <div className="font-medium">Fri</div>
            <div className="text-gray-500">8</div>
          </div>
          <div className="p-3 text-center">
            <div className="font-medium">Sat</div>
            <div className="text-gray-500">9</div>
          </div>
        </div>
        
        <div className="grid grid-cols-8 h-96 overflow-y-auto">
          <div className="border-r border-gray-200">
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">8 AM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">9 AM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">10 AM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">11 AM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">12 PM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">1 PM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">2 PM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">3 PM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">4 PM</div>
            <div className="p-2 text-xs text-gray-500 border-b border-gray-200">5 PM</div>
            </div>
            
          {/* Each day column would have events positioned according to time */}
          <div className="border-r border-gray-200 relative">
            {/* Empty time slots */}
            </div>
          <div className="border-r border-gray-200 relative">
            <div className="absolute top-0 left-0 right-0 h-12 mt-8 mx-1 p-1 bg-green-100 text-green-800 text-xs rounded border border-green-200">
              Rent Due (All day)
            </div>
            </div>
          <div className="border-r border-gray-200 relative">
            {/* Empty time slots */}
            </div>
          <div className="border-r border-gray-200 relative">
            {/* Empty time slots */}
            </div>
          <div className="border-r border-gray-200 relative">
            {/* Empty time slots */}
            </div>
          <div className="border-r border-gray-200 relative">
            <div className="absolute top-0 left-0 right-0 h-24 mt-56 mx-1 p-1 bg-purple-100 text-purple-800 text-xs rounded border border-purple-200">
              Maintenance Visit (2:00 PM - 4:00 PM)
            </div>
          </div>
          <div className="relative">
            {/* Empty time slots */}
          </div>
        </div>
      </div>
    );
  };

  // Render the day view
  const renderDayView = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 text-center">
          <h3 className="text-lg font-medium">Wednesday, March 10, 2024</h3>
        </div>
        
        <div className="h-96 overflow-y-auto">
          {/* Time slots */}
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">8 AM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">9 AM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200 bg-blue-50">
            <div className="col-span-1 p-2 text-xs text-gray-500">10 AM</div>
            <div className="col-span-11 p-2">
              <div className="bg-blue-100 text-blue-800 p-2 rounded border border-blue-200">
                <div className="font-medium">Meeting with Property Manager</div>
                <div className="text-xs flex items-center mt-1">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  10:00 AM - 11:00 AM
              </div>
                <div className="text-xs flex items-center mt-1">
                  <MapPinIcon className="h-3 w-3 mr-1" />
                  Main Office
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">11 AM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">12 PM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">1 PM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">2 PM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">3 PM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">4 PM</div>
            <div className="col-span-11 p-2"></div>
          </div>
          <div className="grid grid-cols-12 border-b border-gray-200">
            <div className="col-span-1 p-2 text-xs text-gray-500">5 PM</div>
            <div className="col-span-11 p-2"></div>
          </div>
        </div>
      </div>
    );
  };

  // Render the list view
  const renderListView = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">March 2024 Events</h3>
            </div>
            
        <div className="divide-y divide-gray-200">
          {events.map(event => (
            <div key={event.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className={`${getEventColor(event.type)} px-2 py-1 rounded-full text-xs font-medium mr-3`}>
                  {event.date.split('-')[2]}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{event.title}</h4>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {event.time}
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <MapPinIcon className="h-3 w-3 mr-1" />
                    {event.location}
              </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/calendar" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Calendar</Heading>
            <Text className="text-gray-500 mt-1">Schedule and manage your property appointments and events.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Today
            </button>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800"
            >
              <PlusIcon className="h-5 w-5 inline-block mr-1" />
              Add Event
            </button>
          </div>
              </div>
        
        {/* Event Form Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-transparent transition-opacity" onClick={() => setIsDrawerOpen(false)} />
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex-1 h-0 overflow-y-auto">
                      <div className="py-6 px-4 bg-gray-50 sm:px-6">
                <div className="flex items-center justify-between">
                          <h2 className="text-lg font-medium text-gray-900">Add New Event</h2>
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setIsDrawerOpen(false)}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="px-4 sm:px-6">
                          <form onSubmit={handleSubmit} className="space-y-6 pt-6 pb-5">
                            <div>
                              <label htmlFor="title" className="block text-sm font-medium text-gray-900">
                                Event Title
                              </label>
                              <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={newEvent.title}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label htmlFor="date" className="block text-sm font-medium text-gray-900">
                                Date
                              </label>
                              <input
                                type="date"
                                name="date"
                                id="date"
                                required
                                value={newEvent.date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-900">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  name="startTime"
                                  id="startTime"
                                  required
                                  value={newEvent.startTime}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-900">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  name="endTime"
                                  id="endTime"
                                  required
                                  value={newEvent.endTime}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="location" className="block text-sm font-medium text-gray-900">
                                Location
                              </label>
                              <input
                                type="text"
                                name="location"
                                id="location"
                                value={newEvent.location}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label htmlFor="type" className="block text-sm font-medium text-gray-900">
                                Event Type
                              </label>
                              <select
                                name="type"
                                id="type"
                                required
                                value={newEvent.type}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
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
                              <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                                Description
                              </label>
                              <textarea
                                name="description"
                                id="description"
                                rows={3}
                                value={newEvent.description}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div className="mt-5 sm:mt-6">
                              <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 sm:text-sm"
                              >
                                Add Event
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button className="p-1 rounded-md text-gray-400 hover:text-gray-500">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button className="p-1 rounded-md text-gray-400 hover:text-gray-500">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <h2 className="ml-4 text-xl font-semibold text-gray-900">March 2024</h2>
            </div>
            <div className="flex">
              <button 
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentView === 'month' 
                    ? 'text-gray-700 bg-white border border-gray-300' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                onClick={() => setCurrentView('month')}
              >
                Month
              </button>
              <button 
                className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${
                  currentView === 'week' 
                    ? 'text-gray-700 bg-white border border-gray-300' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                onClick={() => setCurrentView('week')}
              >
                Week
              </button>
              <button 
                className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${
                  currentView === 'day' 
                    ? 'text-gray-700 bg-white border border-gray-300' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                onClick={() => setCurrentView('day')}
              >
                Day
              </button>
              <button 
                className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${
                  currentView === 'list' 
                    ? 'text-gray-700 bg-white border border-gray-300' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                onClick={() => setCurrentView('list')}
              >
                List
              </button>
            </div>
          </div>
          
          {/* Render the current view */}
          {renderCalendarView()}
        </div>
      </div>
    </SidebarLayout>
  );
} 