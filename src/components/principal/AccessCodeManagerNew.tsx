import React from 'react';
import { InvitationManager } from './InvitationManager';

/**
 * @deprecated This component is replaced by InvitationManager
 * The new invitation system uses email-based invitations instead of access codes
 */
export const AccessCodeManager: React.FC = () => {
    return <InvitationManager />;
};
