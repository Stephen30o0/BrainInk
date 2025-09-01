import React, { useState, useEffect } from 'react';
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';
import { calendarService, CalendarEvent, CalendarEventCreate } from '@/services/calendarService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Users, BookOpen, FileText, Plus, Check, X, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isValid, subMonths, addMonths } from 'date-fns';

interface CalendarTabProps {
    currentUser: any;
    assignments?: any[];
    syllabuses?: any[];
}

interface EventDetailsModalProps {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (event: CalendarEvent) => void;
    onDelete?: (eventId: number) => void;
}

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: CalendarEventCreate) => void;
    assignments?: any[];
    syllabuses?: any[];
    subjects?: any[];
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
    event,
    isOpen,
    onClose,
    onEdit,
    onDelete
}) => {
    if (!isOpen || !event) return null;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'scheduled': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge className={getPriorityColor(event.priority)}>
                                {event.priority.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(event.status)}>
                                {event.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                                {event.event_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                        </div>

                        {event.description && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-700">{event.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Clock size={16} />
                                    Time
                                </h3>
                                <p className="text-gray-700">
                                    {event.all_day ? 'All Day' : (
                                        <>
                                            {format(new Date(event.start_date), 'MMM dd, yyyy h:mm a')}
                                            {' - '}
                                            {format(new Date(event.end_date), 'h:mm a')}
                                        </>
                                    )}
                                </p>
                            </div>

                            {event.attendee_count && event.attendee_count > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Users size={16} />
                                        Attendees
                                    </h3>
                                    <p className="text-gray-700">{event.attendee_count} attendees</p>
                                </div>
                            )}
                        </div>

                        {(event.subject_name || event.assignment_title || event.syllabus_title) && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Related</h3>
                                <div className="space-y-1">
                                    {event.subject_name && (
                                        <p className="text-gray-700 flex items-center gap-2">
                                            <BookOpen size={16} />
                                            Subject: {event.subject_name}
                                        </p>
                                    )}
                                    {event.assignment_title && (
                                        <p className="text-gray-700 flex items-center gap-2">
                                            <FileText size={16} />
                                            Assignment: {event.assignment_title}
                                        </p>
                                    )}
                                    {event.syllabus_title && (
                                        <p className="text-gray-700 flex items-center gap-2">
                                            <FileText size={16} />
                                            Syllabus: {event.syllabus_title}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            {onEdit && (
                                <Button variant="outline" onClick={() => onEdit(event)}>
                                    Edit Event
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="destructive"
                                    onClick={() => onDelete(event.id)}
                                >
                                    Delete Event
                                </Button>
                            )}
                            <Button onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    assignments = [], // eslint-disable-line @typescript-eslint/no-unused-vars
    syllabuses = [], // eslint-disable-line @typescript-eslint/no-unused-vars
    subjects = [] // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
    // Note: assignments, syllabuses, and subjects are available for future use in form dropdowns
    // Mark currently unused props as used to satisfy TypeScript noUnusedLocals
    void assignments;
    void syllabuses;
    void subjects;
    const [formData, setFormData] = useState<CalendarEventCreate>({
        title: '',
        description: '',
        event_type: 'custom_event',
        priority: 'medium',
        start_date: '',
        end_date: '',
        all_day: false,
        send_notification: true,
        notification_minutes_before: 15
    });

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const startDate = format(now, "yyyy-MM-dd'T'HH:mm");
            const endDate = format(addDays(now, 0), "yyyy-MM-dd'T'HH:mm");

            setFormData(prev => ({
                ...prev,
                start_date: startDate,
                end_date: endDate
            }));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure proper ISO format for dates
        const startDate = formData.start_date.includes('T') ?
            `${formData.start_date}:00` :
            `${formData.start_date}T00:00:00`;

        const endDate = formData.end_date.includes('T') ?
            `${formData.end_date}:00` :
            `${formData.end_date}T23:59:59`;

        const eventData = {
            ...formData,
            start_date: startDate,
            end_date: endDate,
            description: formData.description || undefined // Don't send empty string
        };

        console.log('Submitting event data:', eventData);
        onSubmit(eventData);
        onClose();
        setFormData({
            title: '',
            description: '',
            event_type: 'custom_event',
            priority: 'medium',
            start_date: '',
            end_date: '',
            all_day: false,
            send_notification: true,
            notification_minutes_before: 15
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter event title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter event description"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Event Type
                                </label>
                                <select
                                    value={formData.event_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="other">Other</option>
                                    <option value="assignment">Assignment</option>
                                    <option value="class">Class</option>
                                    <option value="exam">Exam</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="syllabus">Syllabus</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.start_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.end_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="all_day"
                                checked={formData.all_day}
                                onChange={(e) => setFormData(prev => ({ ...prev, all_day: e.target.checked }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="all_day" className="text-sm font-medium text-gray-700">
                                All Day Event
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="send_notification"
                                checked={formData.send_notification}
                                onChange={(e) => setFormData(prev => ({ ...prev, send_notification: e.target.checked }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="send_notification" className="text-sm font-medium text-gray-700">
                                Send Notification
                            </label>
                        </div>

                        {formData.send_notification && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notification (minutes before)
                                </label>
                                <select
                                    value={formData.notification_minutes_before}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notification_minutes_before: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={5}>5 minutes</option>
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={1440}>1 day</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create Event
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};



export const CalendarTab: React.FC<CalendarTabProps> = ({
    currentUser, // eslint-disable-line @typescript-eslint/no-unused-vars
    assignments = [],
    syllabuses = []
}) => {
    // currentUser isn't used yet in this component, mark as used to satisfy TS
    void currentUser;
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendarData, setCalendarData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
    const [createEventOpen, setCreateEventOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);

    useEffect(() => {
        loadCalendarEvents();
    }, []);

    // Auto-create calendar events for assignments (with or without due dates)
    const createAssignmentEvents = async () => {
        try {
            console.log('📝 Creating assignment events for:', assignments.length, 'assignments');

            for (const assignment of assignments) {
                console.log('📋 Processing assignment:', {
                    id: assignment.assignment_id || assignment.id,
                    title: assignment.title,
                    due_date: assignment.due_date,
                    created_date: assignment.created_date,
                    subject_id: assignment.subject_id,
                    subject_name: assignment.subject_name
                });
                console.log(`📅 Assignment "${assignment.title}" has due_date:`, assignment.due_date);

                if (assignment.assignment_id || assignment.id) {
                    // Check if event already exists by looking for assignment_id in existing events
                    const assignmentId = assignment.assignment_id || assignment.id;
                    const existingEvent = events.find(e => e.assignment_id === assignmentId);

                    if (!existingEvent) {
                        console.log(`🆕 No existing event found for assignment "${assignment.title}", creating new event...`);
                        // Get school_id from user data or assignment data
                        const schoolId = currentUser?.school_id || assignment.school_id || 1;

                        let eventData: CalendarEventCreate;

                        if (assignment.due_date) {
                            // Assignment has due date - create as assignment_due
                            console.log(`📅 Creating due date event for "${assignment.title}" on ${assignment.due_date}`);
                            eventData = {
                                title: `Assignment Due: ${assignment.title}`,
                                description: assignment.description || `Assignment in ${assignment.subject_name || 'Unknown Subject'}`,
                                event_type: 'assignment_due',
                                priority: 'high',
                                start_date: assignment.due_date,
                                end_date: assignment.due_date,
                                all_day: true,
                                send_notification: true,
                                notification_minutes_before: 1440, // 24 hours before
                                assignment_id: assignmentId,
                                subject_id: assignment.subject_id,
                                school_id: schoolId
                            };
                        } else {
                            // Assignment has no due date - create as assignment_created on creation date
                            const createdDate = new Date(assignment.created_date);
                            const createdDateISO = createdDate.toISOString().split('T')[0] + 'T09:00:00'; // Set to 9 AM on creation date
                            console.log(`📝 Creating creation date event for "${assignment.title}" on ${createdDateISO}`);

                            eventData = {
                                title: `Assignment: ${assignment.title}`,
                                description: `${assignment.description || `Assignment in ${assignment.subject_name || 'Unknown Subject'}`}\n\nNote: This assignment has no due date set.`,
                                event_type: 'assignment_created',
                                priority: 'medium',
                                start_date: createdDateISO,
                                end_date: createdDateISO,
                                all_day: false,
                                send_notification: true,
                                notification_minutes_before: 60, // 1 hour before
                                assignment_id: assignmentId,
                                subject_id: assignment.subject_id,
                                school_id: schoolId
                            };
                        }

                        console.log('🔄 Creating calendar event for assignment:', eventData);
                        try {
                            await calendarService.createEvent(eventData);
                            console.log('✅ Created calendar event for assignment:', assignment.title);
                        } catch (createError) {
                            console.error('❌ Failed to create calendar event for assignment:', assignment.title, createError);
                            // Continue with other assignments even if one fails
                        }
                    } else {
                        console.log(`⏭️ Event already exists for assignment "${assignment.title}" (ID: ${assignmentId})`);
                        console.log('🔍 Existing event:', existingEvent);
                    }
                } else {
                    console.log('⚠️ Skipping assignment without ID:', assignment.title);
                }
            }
        } catch (error) {
            console.error('❌ Error auto-creating assignment events:', error);
            // Don't throw error, just log it to not break calendar loading
        }
    };

    // Auto-create calendar events for syllabus milestones
    const createSyllabusEvents = async () => {
        try {
            console.log('📚 Creating syllabus events for:', syllabuses.length, 'syllabuses');

            for (const syllabus of syllabuses) {
                console.log('📖 Processing syllabus:', syllabus);

                if (syllabus.id) {
                    // Check if event already exists by looking for syllabus_id in existing events
                    const existingEvent = events.find(e => e.syllabus_id === syllabus.id);

                    if (!existingEvent) {
                        // Get school_id from user data or syllabus data
                        const schoolId = currentUser?.school_id || syllabus.school_id || 1;

                        const eventData: CalendarEventCreate = {
                            title: `Syllabus: ${syllabus.title}`,
                            description: syllabus.description || `Syllabus for ${syllabus.subject_name || 'Unknown Subject'}`,
                            event_type: 'syllabus_milestone',
                            priority: 'medium',
                            start_date: new Date().toISOString().split('T')[0] + 'T00:00:00',
                            end_date: new Date().toISOString().split('T')[0] + 'T23:59:59',
                            all_day: true,
                            send_notification: true,
                            notification_minutes_before: 60,
                            syllabus_id: syllabus.id,
                            subject_id: syllabus.subject_id,
                            school_id: schoolId
                        };

                        console.log('🔄 Creating calendar event for syllabus:', eventData);
                        await calendarService.createEvent(eventData);
                        console.log('✅ Created calendar event for syllabus:', syllabus.title);
                    } else {
                        console.log('⏭️ Event already exists for syllabus:', syllabus.title);
                    }
                } else {
                    console.log('⚠️ Skipping syllabus without ID:', syllabus.title);
                }
            }
        } catch (error) {
            console.error('Error auto-creating syllabus events:', error);
            // Don't throw error, just log it to not break calendar loading
        }
    };

    const loadCalendarEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            // Expand date range to include historical assignments and future events
            // Start from 6 months ago to catch all assignments
            const sixMonthsAgo = subMonths(new Date(), 6);
            const threeMonthsFromNow = addMonths(new Date(), 3);

            const startDate = format(startOfWeek(sixMonthsAgo), 'yyyy-MM-dd');
            const endDate = format(endOfWeek(threeMonthsFromNow), 'yyyy-MM-dd');

            console.log('📅 Loading calendar events from', startDate, 'to', endDate);
            console.log('👤 Current user:', currentUser);
            console.log('📋 Available assignments:', assignments);
            console.log('📚 Available syllabuses:', syllabuses);

            // Load existing calendar events
            const eventsData = await calendarService.getMyCalendarEvents({
                start_date: startDate,
                end_date: endDate
            });

            // Ensure eventsData is an array
            const eventsArray = Array.isArray(eventsData) ? eventsData : [];
            console.log('📅 Existing events loaded:', eventsArray.length);

            // Auto-create calendar events for assignments with due dates
            await createAssignmentEvents();

            // Auto-create calendar events for syllabus milestones
            await createSyllabusEvents();

            // Reload events after auto-creation
            const updatedEventsData = await calendarService.getMyCalendarEvents({
                start_date: startDate,
                end_date: endDate
            });

            const updatedEventsArray = Array.isArray(updatedEventsData) ? updatedEventsData : eventsArray;
            console.log('📅 Updated events after auto-creation:', updatedEventsArray.length);

            setEvents(updatedEventsArray);
            const formattedData = calendarService.formatEventsForCalendar(updatedEventsArray);
            setCalendarData(formattedData);

        } catch (error) {
            console.error('❌ Error loading calendar events:', error);
            setError('Failed to load calendar events');
            // Set empty data on error
            setEvents([]);
            setCalendarData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (eventData: CalendarEventCreate) => {
        try {
            console.log('Creating new event:', eventData);

            // Add school_id if not already present
            const enhancedEventData = {
                ...eventData,
                school_id: eventData.school_id || currentUser?.school_id || 1
            };

            await calendarService.createEvent(enhancedEventData);
            showNotification('Event created successfully!');
            loadCalendarEvents();
        } catch (error: any) {
            console.error('Error creating event:', error);
            let errorMessage = 'Failed to create event';

            if (error.response?.data?.detail) {
                errorMessage = `Failed to create event: ${error.response.data.detail}`;
            } else if (error.response?.status === 422) {
                errorMessage = 'Invalid event data. Please check all fields and try again.';
            }

            showNotification(errorMessage, 'error');
        }
    };

    const handleDeleteEvent = async (eventId: number) => {
        try {
            await calendarService.deleteEvent(eventId);
            showNotification('Event deleted successfully!');
            setEventDetailsOpen(false);
            loadCalendarEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification('Failed to delete event', 'error');
        }
    };

    const handleEventClick = (event: any) => {
        if (event.originalEvent) {
            setSelectedEvent(event.originalEvent);
            setEventDetailsOpen(true);
        }
    };

    const handleDayClick = (day: Date, dayEvents: any[]) => {
        setSelectedDayEvents(dayEvents);
        console.log(`Selected ${format(day, 'MMM dd, yyyy')} with ${dayEvents.length} events`);
    };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="text-blue-600" size={28} />
                        Calendar
                    </h2>
                    <p className="text-gray-600">Manage your schedule and events</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={() => setCreateEventOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus size={16} />
                        New Event
                    </Button>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${notification.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-green-50 border border-green-200 text-green-800'
                    }`}>
                    {notification.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                    {notification.message}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadCalendarEvents}
                        className="ml-auto"
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* Calendar Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {events.filter(e => format(new Date(e.start_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {events.filter(e => {
                                const eventDate = new Date(e.start_date);
                                const weekStart = startOfWeek(new Date());
                                const weekEnd = endOfWeek(new Date());
                                return eventDate >= weekStart && eventDate <= weekEnd;
                            }).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {events.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Component */}
            <Card>
                <CardContent className="p-0">
                    <FullScreenCalendar
                        data={calendarData}
                        onNewEvent={() => setCreateEventOpen(true)}
                        onEventClick={handleEventClick}
                        onDayClick={handleDayClick}
                    />
                </CardContent>
            </Card>

            {/* Selected Day Events Summary */}
            {selectedDayEvents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Day Events</CardTitle>
                        <CardDescription>Events for the selected day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {selectedDayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleEventClick(event)}
                                >
                                    <div>
                                        <p className="font-medium">{event.name}</p>
                                        <p className="text-sm text-gray-600">{event.time}</p>
                                    </div>
                                    <Badge variant="outline">
                                        {event.type?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modals */}
            <EventDetailsModal
                event={selectedEvent}
                isOpen={eventDetailsOpen}
                onClose={() => setEventDetailsOpen(false)}
                onDelete={handleDeleteEvent}
            />

            <CreateEventModal
                isOpen={createEventOpen}
                onClose={() => setCreateEventOpen(false)}
                onSubmit={handleCreateEvent}
                assignments={assignments}
                syllabuses={syllabuses}
            />
        </div>
    );
};
