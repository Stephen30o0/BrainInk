# Teacher Grading & Assignments Integration Guide

## Overview
This guide shows how to integrate the new grading and assignments functionality into your teacher dashboard.

## New Components Created

### 1. GradesAssignmentsService (`src/services/gradesAssignmentsService.ts`)
- Comprehensive service for handling assignments and grading
- Integrates with BrainInk backend API endpoints
- Provides utility methods for grade calculations and analytics

### 2. AssignmentManager (`src/components/teacher/AssignmentManager.tsx`)
- Create, edit, and manage assignments
- View assignment analytics and progress
- Delete assignments with confirmation
- Assignment status tracking (needs grading, overdue, etc.)

### 3. GradingDashboard (`src/components/teacher/GradingDashboard.tsx`)
- Grade assignments efficiently
- Bulk grading functionality
- Student filtering and search
- Real-time grading progress tracking
- Recent grading activity display

### 4. Enhanced TeacherOverview
- Added grading metrics cards
- Assignment and grading analytics
- Integration with new grading service

## Integration Steps

### 1. Add to Teacher Navigation
Update your teacher sidebar/navigation to include:

```tsx
import { AssignmentManager, GradingDashboard } from '../components/teacher';

// In your navigation component
<NavItem href="/teacher/assignments" icon={FileText}>
  Assignments
</NavItem>
<NavItem href="/teacher/grading" icon={BarChart3}>
  Grading
</NavItem>
```

### 2. Add Routes
Add these routes to your teacher dashboard routing:

```tsx
import { AssignmentManager, GradingDashboard } from '../components/teacher';

// In your router
<Route path="/teacher/assignments" component={AssignmentManager} />
<Route path="/teacher/grading" component={GradingDashboard} />
```

### 3. Update TeacherOverview
The TeacherOverview component has been enhanced with grading metrics. Make sure to update your imports:

```tsx
import { TeacherOverview } from '../components/teacher';
```

## API Integration

### Backend Endpoints Used
- `POST /assignments-management/create` - Create assignment
- `GET /assignments-management/my-assignments` - Get teacher's assignments
- `GET /assignments-management/subject/{id}` - Get subject assignments
- `POST /grades-management/create` - Create single grade
- `POST /grades-management/bulk-create` - Create multiple grades
- `GET /grades-management/student/{id}/subject/{id}` - Get student grades

### Authentication
All API calls use the existing authentication system with JWT tokens from localStorage.

## Features Available

### Assignment Management
- ✅ Create assignments with due dates
- ✅ Assign to specific subjects
- ✅ Track grading progress
- ✅ View class averages
- ✅ Assignment status indicators
- ✅ Delete assignments

### Grading System
- ✅ Individual student grading
- ✅ Bulk grading for multiple students
- ✅ Feedback system
- ✅ Grade analytics and progress tracking
- ✅ Recent activity monitoring
- ✅ Student filtering and search

### Analytics & Insights
- ✅ Assignment completion rates
- ✅ Class average calculations
- ✅ Grading progress tracking
- ✅ Student performance insights
- ✅ Recent grading activity

## Usage Examples

### Creating an Assignment
```tsx
const assignmentData = {
  title: "Math Quiz 1",
  subject_id: 1,
  description: "Basic algebra concepts",
  max_points: 100,
  due_date: "2024-12-15T23:59:00"
};

await teacherService.createAssignment(assignmentData);
```

### Grading a Student
```tsx
const gradeData = {
  assignment_id: 1,
  student_id: 123,
  points_earned: 85,
  feedback: "Good work! Review question 3."
};

await gradesAssignmentsService.createGrade(gradeData);
```

### Bulk Grading
```tsx
const bulkData = {
  assignment_id: 1,
  grades: [
    { student_id: 123, points_earned: 85, feedback: "Great job!" },
    { student_id: 124, points_earned: 92, feedback: "Excellent work!" }
  ]
};

await gradesAssignmentsService.createBulkGrades(bulkData);
```

## Customization

### Styling
All components use Tailwind CSS classes. You can customize:
- Color schemes by updating text/bg color classes
- Layout by modifying grid and flex classes
- Spacing with padding/margin classes

### Icons
Components use Lucide React icons. You can replace with your preferred icon library.

### Error Handling
All API calls include try-catch blocks with user-friendly error messages.

## Next Steps

1. **Add to Navigation**: Include new components in your teacher navigation
2. **Test Integration**: Verify API connectivity and data flow
3. **Customize UI**: Adjust styling to match your design system
4. **Add Permissions**: Implement role-based access if needed
5. **Monitor Performance**: Track API response times and optimize as needed

## Support

The integration includes comprehensive logging and error handling. Check the browser console for detailed information about API calls and any issues.

All components are designed to work seamlessly with your existing teacher dashboard infrastructure while providing powerful new grading and assignment management capabilities.
