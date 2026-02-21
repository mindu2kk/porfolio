import { NextResponse } from 'next/server';
import { getActiveSessions } from '@/lib/tracking/session';
import { DEFAULT_FUNNELS, analyzeFunnel, getSessionsInRange } from '@/lib/tracking/funnels';
import { analyzeAllCohorts, createCohortsFromSessions } from '@/lib/tracking/cohorts';
import { getReplaySummaries, analyzeReplayPatterns } from '@/lib/tracking/replay';

export async function GET() {
  try {
    // Get active sessions
    const activeSessions = await getActiveSessions();
    
    // Get sessions from last 30 days for analysis
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recentSessionIds = await getSessionsInRange(thirtyDaysAgo, now);

    // Funnel Analysis
    const funnelAnalyses = await Promise.all(
      DEFAULT_FUNNELS.map(funnel => analyzeFunnel(funnel, recentSessionIds))
    );

    // Cohort Analysis
    let cohortAnalysis = null;
    try {
      // Create cohorts if they don't exist
      if (activeSessions.length > 0) {
        await createCohortsFromSessions(activeSessions);
      }
      cohortAnalysis = await analyzeAllCohorts(6); // 6 months
    } catch (error) {
      console.error('Cohort analysis error:', error);
    }

    // Session Replay Summaries
    const replaySummaries = await getReplaySummaries(
      recentSessionIds.slice(0, 20) // Last 20 sessions
    );

    // Replay Pattern Analysis
    const replayPatterns = await analyzeReplayPatterns(
      recentSessionIds.slice(0, 50) // Last 50 sessions
    );

    // Calculate advanced metrics
    const avgFunnelConversion = funnelAnalyses.length > 0
      ? funnelAnalyses.reduce((sum, f) => sum + f.overallConversionRate, 0) / funnelAnalyses.length
      : 0;

    const avgRetention = cohortAnalysis && cohortAnalysis.overallRetention.length > 0
      ? cohortAnalysis.overallRetention[0].avgRetentionRate
      : 0;

    const avgReplayEngagement = replaySummaries.length > 0
      ? replaySummaries.reduce((sum, r) => sum + r.engagementScore, 0) / replaySummaries.length
      : 0;

    return NextResponse.json({
      summary: {
        totalSessions: recentSessionIds.length,
        activeSessions: activeSessions.length,
        avgFunnelConversion: Math.round(avgFunnelConversion * 10) / 10,
        avgRetention: Math.round(avgRetention * 10) / 10,
        avgReplayEngagement: Math.round(avgReplayEngagement),
        totalFunnels: funnelAnalyses.length,
        totalCohorts: cohortAnalysis?.cohorts.length || 0,
        totalPatterns: replayPatterns.length,
      },
      funnels: funnelAnalyses.map(f => ({
        id: f.funnelId,
        name: f.funnelName,
        totalSessions: f.totalSessions,
        conversionRate: f.overallConversionRate,
        avgCompletionTime: f.avgCompletionTime,
        steps: f.steps.map(s => ({
          name: s.stepName,
          entered: s.entered,
          completed: s.completed,
          dropOff: s.dropOff,
          conversionRate: s.conversionRate,
        })),
      })),
      cohorts: cohortAnalysis ? {
        cohorts: cohortAnalysis.cohorts.map(c => ({
          month: c.cohortMonth,
          totalUsers: c.totalUsers,
          retention: c.retention.slice(0, 6), // First 6 months
        })),
        overallRetention: cohortAnalysis.overallRetention.slice(0, 6),
      } : null,
      replays: {
        summaries: replaySummaries.slice(0, 10),
        patterns: replayPatterns,
      },
    });
  } catch (error) {
    console.error('Advanced analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced analytics' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
