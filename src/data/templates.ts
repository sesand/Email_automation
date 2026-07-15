import type { EmailFormValues } from '../types/email';

export interface EmailTemplate extends Omit<EmailFormValues, 'recipientName' | 'recipientDesignation'> {
  name: string;
  description: string;
}

export const templates: EmailTemplate[] = [
  {
    templateId: 'interview-scheduling',
    name: 'Interview Scheduling',
    description: 'Share interview details and next steps.',
    purpose: 'Interview Scheduling',
    keyPoints: 'Interview date:\nInterview time:\nInterview mode or location:\nMeeting link or next step:',
    tone: 'Professional',
    length: 'Concise',
  },
  {
    templateId: 'offer-follow-up',
    name: 'Offer Letter Follow-up',
    description: 'Request a decision or offer clarification.',
    purpose: 'Offer Letter Follow-up',
    keyPoints: 'Offer shared on:\nExpected response date:\nClarification contact:\nRequested next action:',
    tone: 'Friendly',
    length: 'Standard',
  },
  {
    templateId: 'client-status-update',
    name: 'Client Status Update',
    description: 'Summarise hiring progress for a client.',
    purpose: 'Client Status Update',
    keyPoints: 'Position or project:\nCurrent status:\nCompleted actions:\nPending items:\nRequested next step:',
    tone: 'Formal',
    length: 'Detailed',
  },
];
