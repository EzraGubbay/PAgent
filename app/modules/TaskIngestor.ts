import type { Task } from '../types/task';
import type { TaskIngestorPort } from './GPTResponseHandler';

interface IngestedTask extends Task {
  rawSource: string;
  receivedAt: number;
}

const createId = () => `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeTask = (payload: string): Task => {
  try {
    const parsed = JSON.parse(payload);
    return {
      id: parsed.id ?? createId(),
      name: parsed.name ?? 'Untitled Task',
      description: parsed.description,
      estimatedDuration: parsed.estimated_duration ?? parsed.estimatedDuration,
      deadline: parsed.deadline,
      explicitPriority: parsed.explicit_priority ?? parsed.explicitPriority,
      dependencies: parsed.dependencies ?? [],
      preferredTimeWindows: parsed.preferred_time_windows ?? parsed.preferredTimeWindows ?? [],
      assignedCalendarEventId: parsed.assigned_calendar_event_id ?? parsed.assignedCalendarEventId ?? null,
      tags: parsed.tags ?? [],
      completionStatus: parsed.completion_status ?? parsed.completionStatus ?? 'NotStarted',
    };
  } catch {
    return {
      id: createId(),
      name: payload.slice(0, 80) || 'Untitled Task',
      description: payload,
      completionStatus: 'NotStarted',
    };
  }
};

class TaskIngestor implements TaskIngestorPort {
  private readonly tasks: IngestedTask[] = [];

  async ingestTask(payload: string): Promise<void> {
    const normalized = normalizeTask(payload);
    const hydrated: IngestedTask = {
      ...normalized,
      rawSource: payload,
      receivedAt: Date.now(),
    };

    this.tasks.push(hydrated);
    console.log('TaskIngestor::ingested', hydrated);
  }

  listTasks(): IngestedTask[] {
    return [...this.tasks];
  }

  clearTasks() {
    this.tasks.length = 0;
  }
}

export const taskIngestor = new TaskIngestor();

