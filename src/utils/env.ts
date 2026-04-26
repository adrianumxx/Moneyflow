/**
 * Safe utility to access environment variables in both browser and server environments.
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
  // Try import.meta.env (Vite)
  const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }

  // Try process.env (Server or Define)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key]!;
    }
  } catch (e) {
    // process might not be defined
  }

  return defaultValue;
};

export const isDev = (): boolean => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.DEV;
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV !== 'production';
    }
  } catch (e) {}
  return false;
};
