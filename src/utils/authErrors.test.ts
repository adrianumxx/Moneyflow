import { describe, it, expect } from 'vitest';
import { getFriendlyAuthError } from './authErrors';

describe('getFriendlyAuthError', () => {
  it('maps popup-closed-by-user correctly', () => {
    expect(getFriendlyAuthError({ code: 'auth/popup-closed-by-user' }))
      .toBe('Sign-in was cancelled. You can try again whenever you’re ready.');
  });

  it('maps popup-blocked correctly', () => {
    expect(getFriendlyAuthError({ code: 'auth/popup-blocked' }))
      .toBe('Your browser blocked the sign-in window. Please allow pop-ups or try again.');
  });

  it('maps unauthorized-domain correctly', () => {
    expect(getFriendlyAuthError({ code: 'auth/unauthorized-domain' }))
      .toBe('This domain is not authorized for sign-in yet. Please check Firebase Authorized Domains.');
  });

  it('uses default message for unknown error', () => {
    expect(getFriendlyAuthError({ code: 'auth/unknown-something' }))
      .toBe('Something went wrong during sign-in. Please try again.');
  });

  it('handles non-object errors gracefully', () => {
    expect(getFriendlyAuthError('Random error string')).toBe('Random error string');
    expect(getFriendlyAuthError(null)).toBe('Something went wrong during sign-in. Please try again.');
  });
});
