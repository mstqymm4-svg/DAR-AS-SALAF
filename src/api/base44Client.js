import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  // Website: same-origin (''). Android app: set VITE_BASE44_SERVER_URL=https://base44.app (see .env.android).
  serverUrl: import.meta.env.VITE_BASE44_SERVER_URL || '',
  requiresAuth: false,
  // Android build sets VITE_BASE44_ANALYTICS=false (no usage tracking). Website unchanged.
  analytics: { enabled: import.meta.env.VITE_BASE44_ANALYTICS !== 'false' },
  appBaseUrl
});
