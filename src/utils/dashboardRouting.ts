import { schoolSelectionService } from '../services/schoolSelectionService';

export type DashboardDestination =
    | '/principal-dashboard'
    | '/teacher-dashboard'
    | '/student-hub'
    | '/role-selection'
    | '/get-started';

export function isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
}

/**
 * Fast, local-only routing decision.
 * Order: logged in -> school assignment -> role -> dashboard.
 */
export function getDashboardDestination(): DashboardDestination {
    if (!isLoggedIn()) {
        return '/get-started';
    }

    const stored = schoolSelectionService.getStoredSchoolRole();

    // If role was confirmed, go straight to the right dashboard.
    if (stored.confirmed) {
        if (stored.role === 'principal') return '/principal-dashboard';
        if (stored.role === 'teacher') return '/teacher-dashboard';
    }

    // If user has started the school flow but not confirmed, send to role selection.
    const hasSomeSchoolInfo = !!stored.schoolId || !!stored.schoolName || !!stored.role;
    if (hasSomeSchoolInfo) {
        return '/role-selection';
    }

    // Default: treat as student web user.
    return '/student-hub';
}
