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
import { CalendarEventFormDrawer } from '../components/CalendarEventFormDrawer'

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

// Define event type
interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'inspection' | 'payment' | 'maintenance' | 'meeting' | 'showing' | 'contract' | 'admin';
}

// Define calendar events for the demo
const events: CalendarEvent[] = [
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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentDay, setCurrentDay] = useState(currentDate.getDate());

  const handleSubmit = (formData: any) => {
    // Here you would typically save the event to your backend
    console.log('New event:', formData);
    setIsDrawerOpen(false);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  // Handle navigation functions
  const handlePrevious = () => {
    if (currentView === 'month') {
      // Go to previous month
      const newDate = new Date(currentYear, currentMonth - 1, 1);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      console.log(`Navigating to ${newDate.toLocaleString('default', { month: 'long' })} ${newDate.getFullYear()}`);
    } else if (currentView === 'week') {
      // Go to previous week
      const newDate = new Date(currentYear, currentMonth, currentDay - 7);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setCurrentDay(newDate.getDate());
      console.log(`Navigating to week of ${newDate.toLocaleDateString()}`);
    } else if (currentView === 'day') {
      // Go to previous day
      const newDate = new Date(currentYear, currentMonth, currentDay - 1);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setCurrentDay(newDate.getDate());
      console.log(`Navigating to ${newDate.toLocaleDateString()}`);
    }
  };

  const handleNext = () => {
    if (currentView === 'month') {
      // Go to next month
      const newDate = new Date(currentYear, currentMonth + 1, 1);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      console.log(`Navigating to ${newDate.toLocaleString('default', { month: 'long' })} ${newDate.getFullYear()}`);
    } else if (currentView === 'week') {
      // Go to next week
      const newDate = new Date(currentYear, currentMonth, currentDay + 7);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setCurrentDay(newDate.getDate());
      console.log(`Navigating to week of ${newDate.toLocaleDateString()}`);
    } else if (currentView === 'day') {
      // Go to next day
      const newDate = new Date(currentYear, currentMonth, currentDay + 1);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setCurrentDay(newDate.getDate());
      console.log(`Navigating to ${newDate.toLocaleDateString()}`);
    }
  };

  // Get current period display
  const getCurrentPeriodDisplay = () => {
    if (currentView === 'month') {
      return `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
    } else if (currentView === 'week') {
      const weekStart = new Date(currentYear, currentMonth, currentDay);
      const weekEnd = new Date(currentYear, currentMonth, currentDay + 6);
      return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    } else if (currentView === 'day') {
      return new Date(currentYear, currentMonth, currentDay).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
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
    // Find events for specific days
    const findEventsForDay = (day: number) => {
      return events.filter(event => {
        const eventDay = parseInt(event.date.split('-')[2]);
        return eventDay === day;
      });
    };
    
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
        {[...Array(31)].map((_, index) => {
          const day = index + 1;
          const isCurrentDay = day === 10;
          const dayEvents = findEventsForDay(day);
          
          return (
            <div 
              key={day}
              className={`bg-white h-32 p-2 ${isCurrentDay ? 'border-2 border-blue-500' : ''}`}
            >
              <div className={`text-sm ${isCurrentDay ? 'font-bold' : ''}`}>{day}</div>
              {dayEvents.map(event => (
                <div 
                  key={event.id} 
                  className={`mt-1 text-xs p-1 ${getEventColor(event.type)} rounded cursor-pointer hover:opacity-75`}
                  onClick={() => handleEventClick(event)}
                >
                  {event.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  // Render the week view
  const renderWeekView = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 border-r border-gray-200"></div>
          {[...Array(7)].map((_, index) => (
            <div key={index} className="p-3 text-center border-r border-gray-200">
              <div className="font-medium">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</div>
              <div className="text-gray-500">{index + 3}</div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-8 h-96 overflow-y-auto">
          <div className="border-r border-gray-200">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="p-2 text-xs text-gray-500 border-b border-gray-200">
                {index + 8} {index + 8 >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>
          
          {[...Array(7)].map((_, dayIndex) => (
            <div key={dayIndex} className="border-r border-gray-200 relative">
              {events
                .filter(event => {
                  const eventDay = parseInt(event.date.split('-')[2]);
                  return eventDay === dayIndex + 3;
                })
                .map(event => (
                  <div
                    key={event.id}
                    className={`absolute left-0 right-0 mx-1 p-1 ${getEventColor(event.type)} text-xs rounded border cursor-pointer hover:opacity-75`}
                    style={{
                      top: '2rem',
                      height: '3rem'
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          ))}
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
          {[...Array(10)].map((_, index) => {
            const hour = index + 8;
            const dayEvents = events.filter(event => {
              const eventDay = parseInt(event.date.split('-')[2]);
              return eventDay === 10;
            });
            
            return (
              <div key={hour} className="grid grid-cols-12 border-b border-gray-200">
                <div className="col-span-1 p-2 text-xs text-gray-500">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
                <div className="col-span-11 p-2">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`${getEventColor(event.type)} p-2 rounded border cursor-pointer hover:opacity-75`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs flex items-center mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {event.time}
                      </div>
                      <div className="text-xs flex items-center mt-1">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {event.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
            <div 
              key={event.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleEventClick(event)}
            >
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
            <button 
              onClick={() => {
                setSelectedEvent(null);
                setIsDrawerOpen(true);
              }}
              className="px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
            >
              <PlusIcon className="h-5 w-5 inline-block mr-1" />
              Add Event
            </button>
          </div>
        </div>
        
        {/* Calendar Event Form Drawer */}
        <CalendarEventFormDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
                  setIsDrawerOpen(false);
                  setSelectedEvent(null);
                }}
          onSubmit={handleSubmit}
          selectedEvent={selectedEvent}
          title="Add New Event"
        />

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button 
                className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                onClick={handlePrevious}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button 
                className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                onClick={handleNext}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <h2 className="ml-4 text-xl font-semibold text-gray-900">{getCurrentPeriodDisplay()}</h2>
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