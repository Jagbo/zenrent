import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  BrowserData, 
  DeviceData, 
  ConnectionMethod, 
  VendorInfo,
  ClientData,
  BrowserPlugin,
  ScreenInfo,
  WindowSize
} from '../services/hmrc/fraudPrevention/types';

/**
 * Hook to collect client data required for HMRC fraud prevention headers
 * 
 * This hook gathers browser and device information on the client side
 * and prepares it for sending to the server to generate fraud prevention headers.
 */
export function useHmrcClientData(): { 
  clientData: ClientData | null; 
  isLoading: boolean; 
  error: Error | null 
} {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function collectClientData() {
      try {
        setIsLoading(true);
        
        // Get or generate device ID
        let deviceId = localStorage.getItem('hmrc_device_id');
        if (!deviceId) {
          deviceId = uuidv4();
          localStorage.setItem('hmrc_device_id', deviceId);
        }
        
        // Collect browser data
        const browserData: BrowserData = {
          userAgent: navigator.userAgent,
          plugins: collectBrowserPlugins(),
          doNotTrack: getDoNotTrackStatus(),
          windowSize: getWindowSize(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screenInfo: getScreenInfo(),
          localIps: await getLocalIps()
        };
        
        // Create device data
        const deviceData: DeviceData = {
          deviceId,
          deviceType: 'Browser'
        };
        
        // Set vendor info
        const vendorInfo: VendorInfo = {
          name: 'ZenRent',
          productName: 'TaxModule',
          productVersion: '1.0.0'
        };
        
        // Create complete client data
        const completeClientData: ClientData = {
          browser: browserData,
          device: deviceData,
          connectionMethod: ConnectionMethod.WEB_APP_VIA_SERVER,
          vendor: vendorInfo
        };
        
        setClientData(completeClientData);
        setError(null);
      } catch (err) {
        console.error('Error collecting client data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error collecting client data'));
      } finally {
        setIsLoading(false);
      }
    }
    
    collectClientData();
  }, []);
  
  return { clientData, isLoading, error };
}

/**
 * Collect information about browser plugins
 */
function collectBrowserPlugins(): BrowserPlugin[] {
  const plugins: BrowserPlugin[] = [];
  
  // Modern browsers are deprecating navigator.plugins, so we need to handle that
  if (navigator.plugins && navigator.plugins.length > 0) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push({
        name: plugin.name,
        description: plugin.description
      });
    }
  }
  
  return plugins;
}

/**
 * Get the Do Not Track status
 */
function getDoNotTrackStatus(): boolean {
  // Different browsers implement DNT differently
  const dnt = navigator.doNotTrack || 
              (window as any).doNotTrack || 
              (navigator as any).msDoNotTrack;
              
  return dnt === '1' || dnt === 'yes' || dnt === true;
}

/**
 * Get window size information
 */
function getWindowSize(): WindowSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Get screen information
 */
function getScreenInfo(): ScreenInfo {
  return {
    width: window.screen.width,
    height: window.screen.height,
    scalingFactor: window.devicePixelRatio || 1,
    colorDepth: window.screen.colorDepth || 24
  };
}

/**
 * Get local IP addresses
 * 
 * Note: This is a best-effort approach. Modern browsers restrict access to local IPs
 * for privacy reasons. This implementation uses WebRTC to try to get local IPs,
 * but it may not work in all browsers and may require user permission.
 */
async function getLocalIps(): Promise<string[] | undefined> {
  try {
    // Check if RTCPeerConnection is available (it might not be in some browsers)
    if (typeof RTCPeerConnection === 'undefined') {
      return undefined;
    }
    
    const ips: string[] = [];
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.services.mozilla.com' }]
    });
    
    // Create a data channel to force ICE candidates to be gathered
    pc.createDataChannel('');
    
    // Create an offer to trigger ICE candidate gathering
    await pc.createOffer().then(offer => pc.setLocalDescription(offer));
    
    // Wait for ICE candidates
    await new Promise<void>(resolve => {
      // We need to set a timeout because ICE gathering can take time
      const timeout = setTimeout(() => resolve(), 1000);
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        
        // Extract IP from candidate string
        const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(event.candidate.candidate);
        if (ipMatch && ipMatch[1] && !ips.includes(ipMatch[1])) {
          ips.push(ipMatch[1]);
        }
      };
    });
    
    // Close the connection
    pc.close();
    
    return ips.length > 0 ? ips : undefined;
  } catch (error) {
    console.warn('Error getting local IPs:', error);
    return undefined;
  }
}
