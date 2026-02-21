// Funnel tracking and conversion analysis
import { kv } from '@vercel/kv';
import { type TrackingEvent } from './events';

export interface FunnelStep {
  id: string;
  name: string;
  eventType?: string;
  urlPattern?: string;
  elementId?: string;
  order: number;
}

export interface Funnel {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  createdAt: number;
}

export interface FunnelAnalysis {
  funnelId: string;
  funnelName: string;
  totalSessions: number;
  steps: {
    stepId: string;
    stepName: string;
    entered: number;
    completed: number;
    dropOff: number;
    conversionRate: number;
    dropOffRate: number;
    avgTimeToComplete: number; // milliseconds
  }[];
  overallConversionRate: number;
  avgCompletionTime: number;
}

// Predefined funnels
export const DEFAULT_FUNNELS: Funnel[] = [
  {
    id: 'homepage-to-contact',
    name: 'Homepage to Contact',
    description: 'Users who view homepage and reach contact section',
    steps: [
      { id: 'step1', name: 'Homepage View', eventType: 'page_view', urlPattern: '^/$', order: 1 },
      { id: 'step2', name: 'Scroll to Projects', eventType: 'scroll_depth', order: 2 },
      { id: 'step3', name: 'Contact Section View', eventType: 'scroll_depth', order: 3 },
      { id: 'step4', name: 'Contact Button Click', elementId: 'contact-button', order: 4 },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'engagement-funnel',
    name: 'Engagement Funnel',
    description: 'User engagement progression',
    steps: [
      { id: 'step1', name: 'Page View', eventType: 'page_view', order: 1 },
      { id: 'step2', name: 'Scroll 25%', eventType: 'scroll_depth', order: 2 },
      { id: 'step3', name: 'Scroll 50%', eventType: 'scroll_depth', order: 3 },
      { id: 'step4', name: 'Any Click', eventType: 'click', order: 4 },
      { id: 'step5', name: 'Scroll 100%', eventType: 'scroll_depth', order: 5 },
    ],
    createdAt: Date.now(),
  },
];

// Analyze funnel for given sessions
export async function analyzeFunnel(
  funnel: Funnel,
  sessionIds: string[]
): Promise<FunnelAnalysis> {
  const stepAnalysis = new Map<string, {
    entered: Set<string>;
    completed: Set<string>;
    completionTimes: number[];
  }>();

  // Initialize step tracking
  funnel.steps.forEach(step => {
    stepAnalysis.set(step.id, {
      entered: new Set(),
      completed: new Set(),
      completionTimes: [],
    });
  });

  // Analyze each session
  for (const sessionId of sessionIds) {
    // Get all events for this session
    const eventIds = await kv.zrange(`events:session:${sessionId}`, 0, -1, {
      byScore: false,
    });

    if (!eventIds || eventIds.length === 0) continue;

    // Fetch events
    const events = await Promise.all(
      eventIds.map(async (id) => {
        const event = await kv.get<TrackingEvent>(`event:${id as string}`);
        return event;
      })
    );

    const validEvents = events.filter((e): e is TrackingEvent => e !== null);
    
    // Sort by timestamp
    validEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Track funnel progression
    let currentStepIndex = 0;
    let stepStartTime = 0;

    for (const event of validEvents) {
      if (currentStepIndex >= funnel.steps.length) break;

      const currentStep = funnel.steps[currentStepIndex];
      const stepData = stepAnalysis.get(currentStep.id)!;

      // Check if event matches current step
      const matches = matchesStep(event, currentStep);

      if (matches) {
        // Mark as entered
        stepData.entered.add(sessionId);

        // If not first step, mark previous step as completed
        if (currentStepIndex > 0) {
          const prevStep = funnel.steps[currentStepIndex - 1];
          const prevStepData = stepAnalysis.get(prevStep.id)!;
          prevStepData.completed.add(sessionId);

          // Calculate time to complete previous step
          if (stepStartTime > 0) {
            const timeToComplete = event.timestamp - stepStartTime;
            prevStepData.completionTimes.push(timeToComplete);
          }
        }

        // Move to next step
        stepStartTime = event.timestamp;
        currentStepIndex++;
      }
    }

    // Mark last step as completed if reached
    if (currentStepIndex === funnel.steps.length) {
      const lastStep = funnel.steps[funnel.steps.length - 1];
      const lastStepData = stepAnalysis.get(lastStep.id)!;
      lastStepData.completed.add(sessionId);
    }
  }

  // Calculate metrics
  const steps = funnel.steps.map((step, index) => {
    const data = stepAnalysis.get(step.id)!;
    const entered = data.entered.size;
    const completed = data.completed.size;
    const dropOff = entered - completed;
    const conversionRate = entered > 0 ? (completed / entered) * 100 : 0;
    const dropOffRate = entered > 0 ? (dropOff / entered) * 100 : 0;
    const avgTimeToComplete = data.completionTimes.length > 0
      ? data.completionTimes.reduce((sum, t) => sum + t, 0) / data.completionTimes.length
      : 0;

    return {
      stepId: step.id,
      stepName: step.name,
      entered,
      completed,
      dropOff,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dropOffRate: Math.round(dropOffRate * 10) / 10,
      avgTimeToComplete: Math.round(avgTimeToComplete),
    };
  });

  // Overall metrics
  const firstStepEntered = steps[0]?.entered || 0;
  const lastStepCompleted = steps[steps.length - 1]?.completed || 0;
  const overallConversionRate = firstStepEntered > 0
    ? (lastStepCompleted / firstStepEntered) * 100
    : 0;

  const allCompletionTimes = Array.from(stepAnalysis.values())
    .flatMap(d => d.completionTimes);
  const avgCompletionTime = allCompletionTimes.length > 0
    ? allCompletionTimes.reduce((sum, t) => sum + t, 0) / allCompletionTimes.length
    : 0;

  return {
    funnelId: funnel.id,
    funnelName: funnel.name,
    totalSessions: sessionIds.length,
    steps,
    overallConversionRate: Math.round(overallConversionRate * 10) / 10,
    avgCompletionTime: Math.round(avgCompletionTime),
  };
}

// Check if event matches funnel step
function matchesStep(event: TrackingEvent, step: FunnelStep): boolean {
  // Check event type
  if (step.eventType && event.type !== step.eventType) {
    return false;
  }

  // Check URL pattern
  if (step.urlPattern && event.metadata.page) {
    const regex = new RegExp(step.urlPattern);
    if (!regex.test(event.metadata.page)) {
      return false;
    }
  }

  // Check element ID
  if (step.elementId && event.metadata.elementId !== step.elementId) {
    return false;
  }

  // Special handling for scroll depth
  if (event.type === 'scroll_depth') {
    const depth = event.metadata.depth;
    if (step.name.includes('25%') && depth !== 25) return false;
    if (step.name.includes('50%') && depth !== 50) return false;
    if (step.name.includes('75%') && depth !== 75) return false;
    if (step.name.includes('100%') && depth !== 100) return false;
  }

  return true;
}

// Get all sessions in time range
export async function getSessionsInRange(
  startTime: number,
  endTime: number
): Promise<string[]> {
  try {
    const sessionIds = await kv.zrange('sessions:active', startTime, endTime, {
      byScore: true,
    });
    return sessionIds as string[];
  } catch (error) {
    console.error('Failed to get sessions in range:', error);
    return [];
  }
}
