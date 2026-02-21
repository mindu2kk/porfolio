import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  browser: {
    name: string;
    version: string;
    major: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: string;
    vendor: string;
    model: string;
  };
  engine: {
    name: string;
    version: string;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  features: {
    touchSupport: boolean;
    cookieEnabled: boolean;
    language: string;
    timezone: string;
    platform: string;
  };
}

// Parse user agent string
export function parseUserAgent(userAgent: string): Partial<DeviceInfo> {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || 'Unknown',
      major: result.browser.major || 'Unknown',
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || 'Unknown',
    },
    device: {
      type: result.device.type || 'desktop',
      vendor: result.device.vendor || 'Unknown',
      model: result.device.model || 'Unknown',
    },
    engine: {
      name: result.engine.name || 'Unknown',
      version: result.engine.version || 'Unknown',
    },
  };
}

// Get device category
export function getDeviceCategory(deviceInfo: Partial<DeviceInfo>): string {
  const type = deviceInfo.device?.type;
  if (type === 'mobile') return 'Mobile';
  if (type === 'tablet') return 'Tablet';
  if (type === 'smarttv') return 'Smart TV';
  if (type === 'wearable') return 'Wearable';
  if (type === 'console') return 'Console';
  return 'Desktop';
}

// Get browser icon
export function getBrowserIcon(browserName: string): string {
  const name = browserName.toLowerCase();
  if (name.includes('chrome')) return '🌐';
  if (name.includes('firefox')) return '🦊';
  if (name.includes('safari')) return '🧭';
  if (name.includes('edge')) return '🌊';
  if (name.includes('opera')) return '🎭';
  if (name.includes('brave')) return '🦁';
  return '🌍';
}

// Get OS icon
export function getOSIcon(osName: string): string {
  const name = osName.toLowerCase();
  if (name.includes('windows')) return '🪟';
  if (name.includes('mac') || name.includes('ios')) return '🍎';
  if (name.includes('android')) return '🤖';
  if (name.includes('linux')) return '🐧';
  return '💻';
}

// Calculate device stats from visitor logs
export function calculateDeviceStats(logs: Array<{ userAgent: string }>) {
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  
  logs.forEach(log => {
    const info = parseUserAgent(log.userAgent);
    
    // Count browsers
    const browser = `${info.browser?.name} ${info.browser?.major}`;
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    
    // Count OS
    const os = info.os?.name || 'Unknown';
    osMap.set(os, (osMap.get(os) || 0) + 1);
    
    // Count devices
    const device = getDeviceCategory(info);
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
  });
  
  return {
    browsers: Array.from(browserMap.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    os: Array.from(osMap.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    devices: Array.from(deviceMap.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value),
  };
}
