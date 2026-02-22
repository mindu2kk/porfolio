// Comprehensive system test
const BASE_URL = 'https://porfolio-du-minh.vercel.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

function pass(message) { log(colors.green, '✓', message); }
function fail(message) { log(colors.red, '✗', message); }
function warn(message) { log(colors.yellow, '⚠', message); }
function info(message) { log(colors.cyan, 'ℹ', message); }
function section(message) { log(colors.blue, '▶', `\n${message}`); }

async function testAPI(name, url, validator) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      fail(`${name}: HTTP ${response.status}`);
      return false;
    }
    const data = await response.json();
    const result = validator(data);
    if (result === true) {
      pass(`${name}`);
      return true;
    } else {
      fail(`${name}: ${result}`);
      return false;
    }
  } catch (error) {
    fail(`${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  COMPREHENSIVE SYSTEM TEST');
  console.log('='.repeat(60));

  let totalTests = 0;
  let passedTests = 0;

  // PHASE 1: Analytics API
  section('PHASE 1: Event Tracking Analytics API');
  
  totalTests++;
  if (await testAPI(
    'Analytics API responds',
    `${BASE_URL}/api/tracking/analytics`,
    (data) => data.summary ? true : 'Missing summary'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has active sessions data',
    `${BASE_URL}/api/tracking/analytics`,
    (data) => typeof data.summary.activeSessions === 'number' ? true : 'Invalid activeSessions'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has total events data',
    `${BASE_URL}/api/tracking/analytics`,
    (data) => typeof data.summary.totalEvents === 'number' ? true : 'Invalid totalEvents'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has events by type',
    `${BASE_URL}/api/tracking/analytics`,
    (data) => Array.isArray(data.eventsByType) ? true : 'Invalid eventsByType'
  )) passedTests++;

  // PHASE 2: Behavior API
  section('PHASE 2: Behavior Tracking API');

  totalTests++;
  if (await testAPI(
    'Behavior API responds',
    `${BASE_URL}/api/tracking/behavior`,
    (data) => data.summary ? true : 'Missing summary'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has scroll events data',
    `${BASE_URL}/api/tracking/behavior`,
    (data) => typeof data.summary.scrollEvents === 'number' ? true : 'Invalid scrollEvents'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has click events data',
    `${BASE_URL}/api/tracking/behavior`,
    (data) => typeof data.summary.clickEvents === 'number' ? true : 'Invalid clickEvents'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has engagement score',
    `${BASE_URL}/api/tracking/behavior`,
    (data) => typeof data.summary.avgEngagement === 'number' ? true : 'Invalid avgEngagement'
  )) passedTests++;

  // PHASE 3: Performance API
  section('PHASE 3: Performance Metrics API');

  totalTests++;
  if (await testAPI(
    'Performance API responds',
    `${BASE_URL}/api/tracking/performance`,
    (data) => data.summary ? true : 'Missing summary'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has Web Vitals data',
    `${BASE_URL}/api/tracking/performance`,
    (data) => data.webVitals ? true : 'Missing webVitals'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has environment data',
    `${BASE_URL}/api/tracking/performance`,
    (data) => data.environment ? true : 'Missing environment'
  )) passedTests++;

  // PHASE 4: Advanced Analytics API
  section('PHASE 4: Advanced Analytics API');

  totalTests++;
  if (await testAPI(
    'Advanced API responds',
    `${BASE_URL}/api/tracking/advanced`,
    (data) => data.summary ? true : 'Missing summary'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has funnels data',
    `${BASE_URL}/api/tracking/advanced`,
    (data) => Array.isArray(data.funnels) && data.funnels.length > 0 ? true : 'Invalid funnels'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Funnels have steps',
    `${BASE_URL}/api/tracking/advanced`,
    (data) => {
      const funnel = data.funnels[0];
      return Array.isArray(funnel.steps) && funnel.steps.length > 0 ? true : 'Invalid steps';
    }
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has cohorts data',
    `${BASE_URL}/api/tracking/advanced`,
    (data) => data.cohorts !== undefined ? true : 'Missing cohorts'
  )) passedTests++;

  totalTests++;
  if (await testAPI(
    'Has replay patterns',
    `${BASE_URL}/api/tracking/advanced`,
    (data) => Array.isArray(data.replays.patterns) ? true : 'Invalid patterns'
  )) passedTests++;

  // DATA QUALITY CHECKS
  section('DATA QUALITY CHECKS');

  const analyticsData = await fetch(`${BASE_URL}/api/tracking/analytics`).then(r => r.json());
  const behaviorData = await fetch(`${BASE_URL}/api/tracking/behavior`).then(r => r.json());
  const performanceData = await fetch(`${BASE_URL}/api/tracking/performance`).then(r => r.json());
  const advancedData = await fetch(`${BASE_URL}/api/tracking/advanced`).then(r => r.json());

  totalTests++;
  if (analyticsData.summary.totalEvents > 0) {
    pass('Has events in system');
    passedTests++;
  } else {
    warn('No events in system - tracking may not be working');
  }

  totalTests++;
  if (behaviorData.summary.scrollEvents > 0 || behaviorData.summary.clickEvents > 0) {
    pass('Has behavior events');
    passedTests++;
  } else {
    warn('No behavior events - user interactions not tracked');
  }

  totalTests++;
  if (performanceData.summary.totalWebVitalEvents > 0) {
    pass('Has Web Vitals data');
    passedTests++;
  } else {
    warn('No Web Vitals data');
  }

  totalTests++;
  if (advancedData.summary.totalSessions > 0) {
    pass('Has sessions for funnel analysis');
    passedTests++;
  } else {
    fail('No sessions for funnel analysis - CRITICAL ISSUE');
  }

  // FUNNEL ANALYSIS CHECK
  totalTests++;
  const engagementFunnel = advancedData.funnels.find(f => f.id === 'engagement-funnel');
  if (engagementFunnel && engagementFunnel.steps[0].entered > 0) {
    pass('Funnel Step 1 has entries');
    passedTests++;
  } else {
    fail('Funnel Step 1 has 0 entries - funnel matching broken');
  }

  // SUMMARY
  section('TEST SUMMARY');
  console.log('');
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
  console.log(`  Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('');

  if (passedTests === totalTests) {
    log(colors.green, '🎉', 'ALL TESTS PASSED!');
  } else if (passedTests / totalTests >= 0.8) {
    log(colors.yellow, '⚠️', 'MOST TESTS PASSED - Some issues need attention');
  } else {
    log(colors.red, '❌', 'CRITICAL ISSUES DETECTED - System needs fixes');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // DETAILED DIAGNOSTICS
  if (passedTests < totalTests) {
    section('DETAILED DIAGNOSTICS');
    
    info(`Active Sessions: ${analyticsData.summary.activeSessions}`);
    info(`Total Events: ${analyticsData.summary.totalEvents}`);
    info(`Scroll Events: ${behaviorData.summary.scrollEvents}`);
    info(`Click Events: ${behaviorData.summary.clickEvents}`);
    info(`Sessions for Funnel: ${advancedData.summary.totalSessions}`);
    
    if (engagementFunnel) {
      console.log('\nEngagement Funnel Steps:');
      engagementFunnel.steps.forEach((step, idx) => {
        console.log(`  Step ${idx + 1}: ${step.name}`);
        console.log(`    Entered: ${step.entered}, Completed: ${step.completed}`);
      });
    }
    
    console.log('');
  }
}

runTests().catch(console.error);
