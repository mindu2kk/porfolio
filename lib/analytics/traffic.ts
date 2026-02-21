export interface TrafficSource {
  name: string;
  value: number;
  type: 'direct' | 'referral' | 'social' | 'search' | 'other';
}

// Parse referrer to get domain
export function parseReferrer(referer: string): { domain: string; type: string } {
  if (!referer || referer === 'Direct') {
    return { domain: 'Direct', type: 'direct' };
  }
  
  try {
    const url = new URL(referer);
    const domain = url.hostname.replace('www.', '');
    
    // Detect social media
    const socialPlatforms = [
      'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
      'linkedin.com', 'youtube.com', 'tiktok.com', 'reddit.com',
      'pinterest.com', 'snapchat.com', 'telegram.org', 'discord.com'
    ];
    
    if (socialPlatforms.some(platform => domain.includes(platform))) {
      return { domain, type: 'social' };
    }
    
    // Detect search engines
    const searchEngines = [
      'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
      'baidu.com', 'yandex.com', 'ask.com'
    ];
    
    if (searchEngines.some(engine => domain.includes(engine))) {
      return { domain, type: 'search' };
    }
    
    return { domain, type: 'referral' };
  } catch (error) {
    return { domain: 'Unknown', type: 'other' };
  }
}

// Get traffic source icon
export function getTrafficIcon(type: string): string {
  switch (type) {
    case 'direct': return '🔗';
    case 'social': return '📱';
    case 'search': return '🔍';
    case 'referral': return '🌐';
    default: return '❓';
  }
}

// Calculate traffic sources from logs
export function calculateTrafficSources(logs: Array<{ referer: string }>): {
  sources: TrafficSource[];
  byType: TrafficSource[];
} {
  const sourceMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  
  logs.forEach(log => {
    const { domain, type } = parseReferrer(log.referer);
    
    // Count by source
    sourceMap.set(domain, (sourceMap.get(domain) || 0) + 1);
    
    // Count by type
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });
  
  const sources = Array.from(sourceMap.entries())
    .map(([name, value]) => {
      const { type } = parseReferrer(name === 'Direct' ? 'Direct' : `https://${name}`);
      return { name, value, type: type as any };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  const byType = Array.from(typeMap.entries())
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      type: name as any,
    }))
    .sort((a, b) => b.value - a.value);
  
  return { sources, byType };
}

// Parse UTM parameters
export function parseUTMParameters(referer: string): {
  campaign?: string;
  source?: string;
  medium?: string;
  term?: string;
  content?: string;
} {
  if (!referer || referer === 'Direct') return {};
  
  try {
    const url = new URL(referer);
    const params = url.searchParams;
    
    return {
      campaign: params.get('utm_campaign') || undefined,
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      term: params.get('utm_term') || undefined,
      content: params.get('utm_content') || undefined,
    };
  } catch (error) {
    return {};
  }
}
