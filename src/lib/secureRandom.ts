const DEFAULT_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const getCrypto = () => {
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    return globalThis.crypto;
  }

  throw new Error('Secure random generator not available on this platform.');
};

export const generateSecureRandomString = (length: number, charset: string = DEFAULT_CHARSET): string => {
  if (length <= 0) {
    throw new Error('Length must be greater than zero.');
  }

  const cryptoInstance = getCrypto();
  const randomValues = new Uint8Array(length);
  cryptoInstance.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < randomValues.length; i += 1) {
    result += charset[randomValues[i] % charset.length];
  }

  return result;
};
