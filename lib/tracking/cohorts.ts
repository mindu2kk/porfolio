// Cohort analysis and retention tracking
import { kv } from '@vercel/kv';
import { type EnhancedSession } from './session';

export interface Cohort {
  id: string;
  name: string;
  month: string; // YYYY-MM format
  userIds: string[];
  firstSessionDate: number;
  totalUsers: number;
}

export interface CohortRetention {
  cohortId: string;
  cohortName: string;
  cohortMonth: string;
  totalUsers: number;
  retention: {
    period: number; // months since cohort start
    periodLabel: string; // "Month 0", "Month 1", etc.
    activeUsers: number;
    retentionRate: number; // percentage
  }[];
}

export interface CohortAnalysis {
  cohorts: CohortRetention[];
  overallRetention: {
    period: number;
    avgRetentionRate: number;
  }[];
}

// Create cohort from sessions
export async function createCohort(
  month: string,
  sessions: EnhancedSession[]
): Promise<Cohort> {
  // Group by user ID
  const userMap = new Map<string, number>();
  
  sessions.forEach(session => {
    const existing = userMap.get(session.userId);
    if (!existing || session.startTime < existing) {
      userMap.set(session.userId, session.startTime);
    }
  });

  const userIds = Array.from(userMap.keys());
  const firstSessionDate = Math.min(...Array.from(userMap.values()));

  const cohort: Cohort = {
    id: `cohort_${month}`,
    name: `Cohort ${month}`,
    month,
    userIds,
    firstSessionDate,
    totalUsers: userIds.length,
  };

  // Store cohort
  await kv.set(`cohort:${cohort.id}`, cohort);
  await kv.zadd('cohorts:all', { score: firstSessionDate, member: cohort.id });

  return cohort;
}

// Analyze cohort retention
export async function analyzeCohortRetention(
  cohort: Cohort,
  maxPeriods: number = 12
): Promise<CohortRetention> {
  const cohortDate = new Date(cohort.firstSessionDate);
  const retention: CohortRetention['retention'] = [];

  // Analyze each period (month)
  for (let period = 0; period < maxPeriods; period++) {
    const periodStart = new Date(cohortDate);
    periodStart.setMonth(periodStart.getMonth() + period);
    
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Count active users in this period
    let activeUsers = 0;

    for (const userId of cohort.userIds) {
      // Check if user had any sessions in this period
      const userEventIds = await kv.zrange(
        `events:user:${userId}`,
        periodStart.getTime(),
        periodEnd.getTime(),
        { byScore: true }
      );

      if (userEventIds && userEventIds.length > 0) {
        activeUsers++;
      }
    }

    const retentionRate = cohort.totalUsers > 0
      ? (activeUsers / cohort.totalUsers) * 100
      : 0;

    retention.push({
      period,
      periodLabel: period === 0 ? 'Month 0' : `Month ${period}`,
      activeUsers,
      retentionRate: Math.round(retentionRate * 10) / 10,
    });

    // Stop if no active users
    if (activeUsers === 0 && period > 0) break;
  }

  return {
    cohortId: cohort.id,
    cohortName: cohort.name,
    cohortMonth: cohort.month,
    totalUsers: cohort.totalUsers,
    retention,
  };
}

// Get all cohorts
export async function getAllCohorts(): Promise<Cohort[]> {
  try {
    const cohortIds = await kv.zrange('cohorts:all', 0, -1, {
      byScore: false,
    });

    if (!cohortIds || cohortIds.length === 0) return [];

    const cohorts = await Promise.all(
      cohortIds.map(async (id) => {
        const cohort = await kv.get<Cohort>(`cohort:${id as string}`);
        return cohort;
      })
    );

    return cohorts.filter((c): c is Cohort => c !== null);
  } catch (error) {
    console.error('Failed to get cohorts:', error);
    return [];
  }
}

// Analyze all cohorts
export async function analyzeAllCohorts(
  maxPeriods: number = 12
): Promise<CohortAnalysis> {
  const cohorts = await getAllCohorts();
  
  const cohortRetentions = await Promise.all(
    cohorts.map(cohort => analyzeCohortRetention(cohort, maxPeriods))
  );

  // Calculate overall retention averages
  const overallRetention: CohortAnalysis['overallRetention'] = [];
  
  for (let period = 0; period < maxPeriods; period++) {
    const periodData = cohortRetentions
      .map(cr => cr.retention.find(r => r.period === period))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);

    if (periodData.length === 0) break;

    const avgRetentionRate = periodData.reduce((sum, r) => sum + r.retentionRate, 0) / periodData.length;

    overallRetention.push({
      period,
      avgRetentionRate: Math.round(avgRetentionRate * 10) / 10,
    });
  }

  return {
    cohorts: cohortRetentions,
    overallRetention,
  };
}

// Create cohorts from sessions grouped by month
export async function createCohortsFromSessions(
  sessions: EnhancedSession[]
): Promise<Cohort[]> {
  // Group sessions by month
  const sessionsByMonth = new Map<string, EnhancedSession[]>();

  sessions.forEach(session => {
    const date = new Date(session.startTime);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!sessionsByMonth.has(month)) {
      sessionsByMonth.set(month, []);
    }
    sessionsByMonth.get(month)!.push(session);
  });

  // Create cohort for each month
  const cohorts: Cohort[] = [];

  for (const [month, monthSessions] of sessionsByMonth.entries()) {
    const cohort = await createCohort(month, monthSessions);
    cohorts.push(cohort);
  }

  return cohorts;
}

// Calculate lifetime value metrics
export interface LifetimeValueMetrics {
  cohortId: string;
  cohortMonth: string;
  totalUsers: number;
  avgSessionsPerUser: number;
  avgDurationPerUser: number; // seconds
  avgPageViewsPerUser: number;
  avgEngagementScore: number;
}

export async function calculateLifetimeValue(
  cohort: Cohort
): Promise<LifetimeValueMetrics> {
  let totalSessions = 0;
  let totalDuration = 0;
  let totalPageViews = 0;
  let totalEngagement = 0;

  for (const userId of cohort.userIds) {
    // Get all user events
    const eventIds = await kv.zrange(`events:user:${userId}`, 0, -1, {
      byScore: false,
    });

    if (!eventIds || eventIds.length === 0) continue;

    // Count sessions (session_start events)
    const sessionEvents = eventIds.filter(async (id) => {
      const event = await kv.get(`event:${id as string}`);
      return event && (event as any).type === 'session_start';
    });

    totalSessions += sessionEvents.length;

    // Get session metrics (simplified - would need to fetch actual sessions)
    totalPageViews += eventIds.length; // Rough estimate
    totalDuration += eventIds.length * 60; // Rough estimate: 60s per event
    totalEngagement += Math.min(eventIds.length * 5, 100); // Rough estimate
  }

  const userCount = cohort.totalUsers || 1;

  return {
    cohortId: cohort.id,
    cohortMonth: cohort.month,
    totalUsers: cohort.totalUsers,
    avgSessionsPerUser: Math.round((totalSessions / userCount) * 10) / 10,
    avgDurationPerUser: Math.round(totalDuration / userCount),
    avgPageViewsPerUser: Math.round((totalPageViews / userCount) * 10) / 10,
    avgEngagementScore: Math.round(totalEngagement / userCount),
  };
}
