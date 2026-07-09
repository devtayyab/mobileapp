export const countryCodes = [
  { name: 'United States', code: 'US', dial_code: '+1' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44' },
  { name: 'Greece', code: 'GR', dial_code: '+30' },
  { name: 'Pakistan', code: 'PK', dial_code: '+92' },
  { name: 'India', code: 'IN', dial_code: '+91' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971' },
  { name: 'Canada', code: 'CA', dial_code: '+1' },
  { name: 'Australia', code: 'AU', dial_code: '+61' },
  { name: 'Germany', code: 'DE', dial_code: '+49' },
  { name: 'France', code: 'FR', dial_code: '+33' },
  { name: 'Spain', code: 'ES', dial_code: '+34' },
  { name: 'Italy', code: 'IT', dial_code: '+39' },
  { name: 'Cyprus', code: 'CY', dial_code: '+357' },
  { name: 'Saudi Arabia', code: 'SA', dial_code: '+966' },
  { name: 'Bangladesh', code: 'BD', dial_code: '+880' }
].sort((a, b) => a.name.localeCompare(b.name));
