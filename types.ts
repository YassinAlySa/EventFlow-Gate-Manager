export interface Visitor {
  id: string;
  fullName: string;
  email: string;
  company: string;
  role: string;
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface EmailLog {
  id: string;
  visitorId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  type: 'Welcome' | 'Thank You';
  timestamp: string;
  status: 'Generated' | 'Sent';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  REGISTRATION = 'REGISTRATION',
  GATE_CONTROL = 'GATE_CONTROL',
  POST_EVENT = 'POST_EVENT',
  COMMUNICATIONS = 'COMMUNICATIONS',
}

export interface EmailTemplate {
  subject: string;
  body: string;
}