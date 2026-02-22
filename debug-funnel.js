// Debug script to check funnel data
const BASE_URL = 'https://porfolio-du-minh.vercel.app';

async function debugFunnel() {
  console.log('🔍 Debugging funnel analysis...\n');
  
  // 1. Check analytics data
  console.log('1️⃣ Checking analytics data...');
  const analyticsRes = await fetch(`${BASE_URL}/api/tracking/analytics`);
  const analytics = await analyticsRes.json();
  
  console.log(`   Active sessions: ${analytics.summary.activeSessions}`);
  console.log(`   Total events: ${analytics.summary.totalEvents}`);
  console.log(`   Event types:`, analytics.eventsByType.slice(0, 5));
  
  if (analytics.sessions && analytics.sessions.length > 0) {
    const firstSession = analytics.sessions[0];
    console.log(`\n   First session ID: ${firstSession.id}`);
    console.log(`   Session events count: ${firstSession.pageViews || 0} page views`);
    console.log(`   Session clicks: ${firstSession.clicks || 0}`);
    console.log(`   Session scroll depth: ${firstSession.scrollDepth || 0}%`);
  }
  
  // 2. Check advanced analytics
  console.log('\n2️⃣ Checking advanced analytics...');
  const advancedRes = await fetch(`${BASE_URL}/api/tracking/advanced`);
  const advanced = await advancedRes.json();
  
  console.log(`   Total sessions for funnel: ${advanced.summary.totalSessions}`);
  console.log(`   Active sessions: ${advanced.summary.activeSessions}`);
  
  // 3. Check funnel data
  console.log('\n3️⃣ Checking funnel data...');
  advanced.funnels.forEach((funnel, idx) => {
    console.log(`\n   Funnel ${idx + 1}: ${funnel.name}`);
    console.log(`   Total sessions: ${funnel.totalSessions}`);
    console.log(`   Conversion rate: ${funnel.conversionRate}%`);
    
    funnel.steps.forEach((step, stepIdx) => {
      console.log(`      Step ${stepIdx + 1}: ${step.name}`);
      console.log(`         Entered: ${step.entered}, Completed: ${step.completed}, Drop-off: ${step.dropOff}`);
    });
  });
  
  // 4. Recommendations
  console.log('\n💡 Analysis:');
  if (analytics.summary.totalEvents === 0) {
    console.log('   ❌ No events found! Events are not being tracked.');
  } else if (advanced.funnels[0].steps[0].entered === 0) {
    console.log('   ❌ Step 1 has 0 entered - events not matching funnel criteria');
    console.log('   📝 Check if page_view events exist');
    console.log('   📝 Check if events have correct metadata');
  } else if (advanced.funnels[0].steps[1].entered === 0) {
    console.log('   ❌ Step 2 has 0 entered - scroll events not matching');
    console.log('   📝 Check if scroll_depth events exist');
    console.log('   📝 Check scroll depth values (should be 25, 50, 75, 100)');
  } else {
    console.log('   ✅ Funnel is working!');
  }
}

debugFunnel().catch(console.error);
