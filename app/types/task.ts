export type PriorityLevel = 'P1_Urgent' | 'P2_High' | 'P3_Medium' | 'P4_Low' | 'P5_Optional' | 'None';

export type CompletionStatus = 'NotStarted' | 'InProgress' | 'Completed';

export interface TimeWindow {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  daysOfWeek: string[];
  flexibilityLevel: 0 | 1 | 2 | 3;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  estimatedDuration?: number;
  deadline?: string;
  explicitPriority?: PriorityLevel;
  dependencies?: string[];
  preferredTimeWindows?: TimeWindow[];
  assignedCalendarEventId?: string | null;
  tags?: string[];
  completionStatus: CompletionStatus;
}

export interface CalendarEvent {
  id: string;
  name: string;
  startDatetime: string;
  endDatetime: string;
  isAllDay?: boolean;
  isFreeSlot?: boolean;
}

