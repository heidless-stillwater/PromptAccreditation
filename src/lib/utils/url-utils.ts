/**
 * getSatelliteAppName - Maps satellite ports to their friendly application identities.
 * Hardened to handle protocol-less strings (e.g., 'localhost:3001').
 */
export function getSatelliteAppName(url: string | null): string {
  if (!url) return 'Satellite App';
  
  let targetUrl = url;
  if (!url.startsWith('http') && !url.startsWith('/')) {
    targetUrl = `http://${url}`;
  }

  try {
    const parsed = new URL(targetUrl);
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    
    switch (port) {
      case '3001': return 'PromptTool';
      case '3002': return 'PromptResources';
      case '5173': return 'PromptMasterSPA';
      default: return 'Satellite App';
    }
  } catch (err) {
    return 'Satellite App';
  }
}

/**
 * getOriginFromUrl - Extracts the protocol + host + port for clean returns.
 */
export function getOriginFromUrl(url: string | null): string | null {
  if (!url) return null;
  
  let targetUrl = url;
  if (!url.startsWith('http') && !url.startsWith('/')) {
    targetUrl = `http://${url}`;
  }

  try {
    const parsed = new URL(targetUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (err) {
    return null;
  }
}

/**
 * isStandardSatellite - Detects if a URL belongs to the known Prompt App Suite.
 */
export function isStandardSatellite(url: string | null): boolean {
  if (!url) return false;
  const name = getSatelliteAppName(url);
  return name !== 'Satellite App';
}
