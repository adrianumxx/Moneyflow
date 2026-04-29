import { auth } from '../firebase';

/**
 * Enhanced fetch wrapper that automatically attaches the Firebase ID Token
 * for authenticated requests to the backend API.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  
  if (!user) {
    console.warn('[authenticatedFetch] No authenticated user found. Request may fail on the server.');
    // We proceed anyway to let the server handle the 401 if it's a protected route,
    // or allow the request if it's a public route.
    return fetch(url, options);
  }

  try {
    // Get the latest ID token, refreshing if necessary
    const token = await user.getIdToken();
    
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    
    // Ensure Content-Type is set if we have a body and it's not already set
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle common auth-related error codes
    if (response.status === 401 || response.status === 403) {
      console.error(`[authenticatedFetch] Authentication error (${response.status}). User might need to re-login.`);
      // Optional: Trigger a logout or redirect if appropriate for the app architecture
    }

    return response;
  } catch (error) {
    console.error('[authenticatedFetch] Error fetching ID token:', error);
    return fetch(url, options);
  }
}
