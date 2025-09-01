import axios from 'axios';

const BASE_URL = 'https://brainink-backend.onrender.com/study-area/calendar';

// Create axios instance with auth token
const createApiClient = () => {
    const token = localStorage.getItem('access_token');
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
};

export interface CalendarEvent {
    id: number;
    title: string;
    description?: string;
    event_type: 'assignment_due' | 'assignment_created' | 'syllabus_milestone' | 'class_schedule' | 'exam' | 'holiday' | 'reminder' | 'custom_event';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
    start_date: string;
    end_date: string;
    all_day: boolean;
    is_recurring: boolean;
    recurrence_pattern?: string;
    recurrence_interval?: number;
    recurrence_end_date?: string;
    subject_id?: number;
    assignment_id?: number;
    syllabus_id?: number;
    classroom_id?: number;
    send_notification: boolean;
    notification_minutes_before?: number;
    school_id: number;
    created_by: number;
    creator_name?: string;
    created_date: string;
    updated_date?: string;
    is_active: boolean;
    subject_name?: string;
    assignment_title?: string;
    syllabus_title?: string;
    classroom_name?: string;
    attendee_count?: number;
    attendees?: CalendarEventAttendee[];
}

export interface CalendarEventAttendee {
    id: number;
    event_id: number;
    user_id: number;
    attendance_status: 'pending' | 'accepted' | 'declined' | 'tentative';
    response_date?: string;
    is_active: boolean;
    user_name?: string;
    user_role?: string;
}

export interface CalendarEventCreate {
    title: string;
    description?: string;
    event_type: 'assignment_due' | 'assignment_created' | 'syllabus_milestone' | 'class_schedule' | 'exam' | 'holiday' | 'reminder' | 'custom_event';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    start_date: string;
    end_date: string;
    all_day?: boolean;
    is_recurring?: boolean;
    recurrence_pattern?: string;
    recurrence_interval?: number;
    recurrence_end_date?: string;
    subject_id?: number;
    assignment_id?: number;
    syllabus_id?: number;
    classroom_id?: number;
    send_notification?: boolean;
    notification_minutes_before?: number;
    school_id?: number;
}

export interface AssignmentCalendarIntegration {
    assignment_id: number;
    create_deadline_event: boolean;
    create_milestone_events: boolean;
    deadline_notification_minutes: number;
    milestone_notification_minutes: number;
}

export interface SyllabusCalendarIntegration {
    syllabus_id: number;
    create_weekly_events: boolean;
    create_milestone_events: boolean;
    weekly_notification_minutes: number;
    milestone_notification_minutes: number;
}

export interface CalendarDashboard {
    upcoming_events: CalendarEvent[];
    overdue_assignments: CalendarEvent[];
    today_events: CalendarEvent[];
    this_week_events: CalendarEvent[];
    event_summary: {
        total_events: number;
        completed_events: number;
        pending_events: number;
        overdue_events: number;
    };
}

export interface CalendarEventListResponse {
    events: CalendarEvent[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
}

class CalendarService {
    async createEvent(eventData: CalendarEventCreate): Promise<CalendarEvent> {
        try {
            console.log('📅 Creating calendar event:', eventData);
            const api = createApiClient();
            const response = await api.post('/events/create', eventData);
            console.log('✅ Calendar event created successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error creating calendar event:', error);
            if (error.response?.data) {
                console.error('Backend error details:', error.response.data);
            }
            throw error;
        }
    } async getEvent(eventId: number): Promise<CalendarEvent> {
        try {
            const api = createApiClient();
            const response = await api.get(`/events/${eventId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching calendar event:', error);
            throw error;
        }
    }

    async updateEvent(eventId: number, eventData: Partial<CalendarEventCreate>): Promise<CalendarEvent> {
        try {
            const api = createApiClient();
            const response = await api.put(`/events/${eventId}`, eventData);
            return response.data;
        } catch (error) {
            console.error('Error updating calendar event:', error);
            throw error;
        }
    }

    async deleteEvent(eventId: number): Promise<void> {
        try {
            const api = createApiClient();
            await api.delete(`/events/${eventId}`);
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            throw error;
        }
    }

    async getEvents(params?: {
        page?: number;
        page_size?: number;
        start_date?: string;
        end_date?: string;
        event_types?: string;
        priorities?: string;
        statuses?: string;
        subject_ids?: string;
        include_completed?: boolean;
    }): Promise<CalendarEventListResponse> {
        try {
            const api = createApiClient();
            const response = await api.get('/events', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw error;
        }
    }

    async getDashboard(): Promise<CalendarDashboard> {
        try {
            const api = createApiClient();
            const response = await api.get('/dashboard');
            return response.data;
        } catch (error) {
            console.error('Error fetching calendar dashboard:', error);
            throw error;
        }
    }

    async getMyCalendarEvents(params?: {
        start_date?: string;
        end_date?: string;
    }): Promise<CalendarEvent[]> {
        try {
            console.log('📅 Fetching my calendar events with params:', params);
            const api = createApiClient();
            const response = await api.get('/my-calendar', { params });
            console.log('✅ Calendar events received:', response.data);

            // Ensure we return an array
            const events = Array.isArray(response.data) ? response.data :
                response.data?.events ||
                response.data?.data ||
                [];

            return events;
        } catch (error: any) {
            console.error('❌ Error fetching my calendar events:', error);
            if (error.response?.data) {
                console.error('Backend error details:', error.response.data);
            }
            throw error;
        }
    }    // Integration endpoints
    async integrateAssignment(integration: AssignmentCalendarIntegration): Promise<{ message: string; events_created: CalendarEvent[] }> {
        try {
            const api = createApiClient();
            const response = await api.post('/integrate/assignment', integration);
            return response.data;
        } catch (error) {
            console.error('Error integrating assignment with calendar:', error);
            throw error;
        }
    }

    async integrateSyllabus(integration: SyllabusCalendarIntegration): Promise<{ message: string; events_created: CalendarEvent[] }> {
        try {
            const api = createApiClient();
            const response = await api.post('/integrate/syllabus', integration);
            return response.data;
        } catch (error) {
            console.error('Error integrating syllabus with calendar:', error);
            throw error;
        }
    }

    // Utility function to format events for the calendar component
    formatEventsForCalendar(events: CalendarEvent[] | any) {
        // Handle case where events might not be an array
        if (!Array.isArray(events)) {
            console.warn('Events is not an array:', events);
            return [];
        }

        const groupedEvents: Record<string, any[]> = {};

        events.forEach(event => {
            const dateKey = new Date(event.start_date).toDateString();
            if (!groupedEvents[dateKey]) {
                groupedEvents[dateKey] = [];
            }

            groupedEvents[dateKey].push({
                id: event.id,
                name: event.title,
                time: this.formatEventTime(event),
                datetime: event.start_date,
                type: event.event_type,
                priority: event.priority,
                status: event.status,
                description: event.description,
                originalEvent: event
            });
        });

        return Object.entries(groupedEvents).map(([dateStr, events]) => ({
            day: new Date(dateStr),
            events: events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
        }));
    } private formatEventTime(event: CalendarEvent): string {
        if (event.all_day) {
            return 'All Day';
        }

        const startTime = new Date(event.start_date);
        const endTime = new Date(event.end_date);

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        if (startTime.toDateString() === endTime.toDateString()) {
            return `${formatTime(startTime)} - ${formatTime(endTime)}`;
        } else {
            return formatTime(startTime);
        }
    }
}

export const calendarService = new CalendarService();
