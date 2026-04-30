/**
 * Maps Firebase Auth error codes to user-friendly, premium messages.
 * Prevents technical jargon and scary error codes from reaching the user.
 */
export const getFriendlyAuthError = (error: any): string => {
  const code = error?.code || '';
  
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. You can try again whenever you’re ready.';
    
    case 'auth/cancelled-popup-request':
      return 'Another sign-in window was already open. Please try again.';
    
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Please allow pop-ups or try again.';
    
    case 'auth/network-request-failed':
      return 'Network issue. Please check your connection and try again.';
    
    case 'auth/user-disabled':
      return 'This account is currently disabled.';
    
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with a different sign-in method.';
    
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in yet. Please check Firebase Authorized Domains.';
    
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later for your security.';

    case 'auth/operation-not-allowed':
      return 'Sign-in method not enabled. Please contact support.';
      
    default:
      // If it's a raw string error from our own logic
      if (typeof error === 'string') return error;
      
      // Default fallback for unknown errors
      return 'Something went wrong during sign-in. Please try again.';
  }
};
