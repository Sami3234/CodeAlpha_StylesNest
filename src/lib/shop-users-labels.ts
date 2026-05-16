/** Client-safe — no database imports */
export function providerLabel(provider: string): string {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    case 'credentials':
      return 'Email';
    default:
      return provider;
  }
}
