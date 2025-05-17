"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/solid";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { getUpcomingObligations } from "@/lib/taxService";
import { useAuth } from "@/lib/auth-provider";

type CalendarEvent = {
  date: string;
  type: string;
  title: string;
  status: "upcoming" | "overdue" | "completed";
};

export default function TaxCalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchCalendarData() {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch obligations
        const obligations = await getUpcomingObligations(user.id);
        
        // Convert obligations to calendar events
        const calendarEvents: CalendarEvent[] = obligations.map(obligation => ({
          date: obligation.dueDate,
          type: obligation.type,
          title: `${obligation.type} ${obligation.taxYear ? `(${obligation.taxYear})` : ''} Due`,
          status: obligation.status === "Fulfilled" 
            ? "completed" 
            : obligation.status === "Overdue" 
              ? "overdue" 
              : "upcoming"
        }));
        
        // Add some fixed tax calendar events
        const fixedEvents: CalendarEvent[] = [
          {
            date: "2025-01-31",
            type: "SelfAssessment",
            title: "Self Assessment Deadline",
            status: "upcoming"
          },
          {
            date: "2025-04-05",
            type: "TaxYear",
            title: "Tax Year End",
            status: "upcoming"
          },
          {
            date: "2025-04-06",
            type: "TaxYear",
            title: "New Tax Year Begins",
            status: "upcoming"
          },
          {
            date: "2025-07-31",
            type: "Payment",
            title: "Second Payment on Account",
            status: "upcoming"
          }
        ];
        
        setEvents([...calendarEvents, ...fixedEvents]);
      } catch (err) {
        console.error("Error fetching tax calendar data:", err);
        setError("Failed to load tax calendar data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCalendarData();
  }, [user]);
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get events for the current day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, day);
      } catch (error) {
        return false;
      }
    });
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "overdue":
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      case "upcoming":
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  return (
    <SidebarLayout>
      <div className="py-10">
        <header className="mb-8">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <Heading level={1}>Tax Calendar</Heading>
            <Text className="mt-2 text-gray-500">
              View your upcoming tax deadlines and important dates
            </Text>
          </div>
        </header>
        
        <main>
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Calendar */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-md hover:bg-gray-100"
                      aria-label="Previous month"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-3 py-1 rounded-md bg-[#F9F7F7] hover:bg-gray-200 text-sm font-medium text-[#330015]"
                    >
                      Today
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-md hover:bg-gray-100"
                      aria-label="Next month"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 py-0">
                {isLoading ? (
                  <div className="py-20 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                    <p>Loading calendar...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 text-sm">
                    {/* Day headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="py-3 text-center font-semibold text-gray-700 border-b border-gray-200"
                      >
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {daysInMonth.map((day, dayIdx) => {
                      const dayEvents = getEventsForDay(day);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div
                          key={day.toString()}
                          className={`min-h-[100px] p-2 border-b border-r border-gray-200 ${
                            dayIdx % 7 === 0 ? "border-l" : ""
                          } ${
                            isToday ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex justify-between">
                            <span
                              className={`text-sm font-medium ${
                                isToday ? "text-blue-600" : "text-gray-700"
                              }`}
                            >
                              {format(day, "d")}
                            </span>
                            {isToday && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                Today
                              </span>
                            )}
                          </div>
                          
                          {/* Events for this day */}
                          <div className="mt-1 space-y-1">
                            {dayEvents.map((event, eventIdx) => (
                              <div
                                key={`${event.title}-${eventIdx}`}
                                className={`px-2 py-1 rounded-md text-xs ${getStatusColor(event.status)}`}
                              >
                                <div className="flex items-center">
                                  {getStatusIcon(event.status)}
                                  <span className="ml-1 truncate">{event.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Upcoming deadlines */}
            <div className="mt-8">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-white px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h2>
                </CardHeader>
                <CardContent className="px-6 py-5">
                  {isLoading ? (
                    <div className="py-10 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                      <p>Loading deadlines...</p>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                      <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p>No upcoming tax deadlines found</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {events
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, 5)
                        .map((event, index) => (
                          <li key={index} className="py-4 flex items-center">
                            <div className="mr-4">
                              {getStatusIcon(event.status)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{event.title}</p>
                              <p className="text-sm text-gray-500">
                                {format(parseISO(event.date), "MMMM d, yyyy")}
                              </p>
                            </div>
                            <div>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(event.status)}`}
                              >
                                {event.status === "completed" ? "Completed" : 
                                 event.status === "overdue" ? "Overdue" : "Upcoming"}
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
