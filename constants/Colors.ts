// ============================================================
//  App Color System — Role-Based Light Themes
//
//  Three palettes share ONE shape (the `Palette` type) so any
//  screen can render with whichever palette matches the signed-in
//  user's role:
//    • b2b      → Wholesale (Pink)
//    • supplier → Retailer  (Blue)
//    • customer → Customer  (Green)
//    • admin    → Retailer  (Blue)
//
//  HOW TO USE (inside a component):
//    import { useTheme } from '@/contexts/ThemeContext';
//    const Colors = useTheme();
//    backgroundColor: Colors.background.primary
//
//  For module-level StyleSheet, wrap in a factory:
//    const createStyles = (Colors: Palette) => StyleSheet.create({ ... });
//    // then inside the component:
//    const styles = useMemo(() => createStyles(Colors), [Colors]);
// ============================================================

export type Palette = {
  primary: string;
  primaryDark: string;
  primaryLight: string;

  secondary: string;
  secondaryDark: string;
  secondaryLight: string;

  accent: string;
  accentDark: string;
  accentLight: string;

  error: string;
  errorDark: string;
  errorLight: string;

  success: string;
  warning: string;
  info: string;

  background: { primary: string; secondary: string; tertiary: string };
  text: { primary: string; secondary: string; tertiary: string; inverse: string };
  border: { light: string; medium: string; dark: string };

  status: {
    pending: string;
    processing: string;
    shipped: string;
    delivered: string;
    cancelled: string;
    refunded: string;
  };

  shadow: { light: string; medium: string; dark: string; cyan: string };

  gradients: {
    premium: [string, string];
    cyan: [string, string];
    dark: [string, string];
    glow: [string, string];
  };
};

// ── Shared neutrals / semantics (identical across all roles) ──
const NEUTRAL = {
  error: '#EF4444',
  errorDark: '#DC2626',
  errorLight: '#FCA5A5',
  success: '#4CAF50',
  warning: '#F59E0B', // also used for star / rating
  info: '#2196F3',
  // Order-status colors are role-independent across all three palettes.
  status: {
    pending: '#F59E0B',
    processing: '#2196F3',
    shipped: '#1976D2',
    delivered: '#4CAF50',
    cancelled: '#EF4444',
    refunded: '#F97316',
  },
  text: {
    primary: '#1F2937',   // headings / body
    secondary: '#111827', // high-emphasis / near black
    tertiary: '#6B7280',  // subtext / placeholders
    inverse: '#FFFFFF',   // text on colored buttons
  },
  border: {
    light: '#F1F5F9',
    medium: '#E5E7EB',
    dark: '#D1D5DB',
  },
  shadowBase: {
    light: 'rgba(15, 23, 42, 0.06)',
    medium: 'rgba(15, 23, 42, 0.12)',
    dark: 'rgba(15, 23, 42, 0.20)',
  },
} as const;

const lightBg = (tint: string) => ({
  primary: '#F1F5F9',   // off-white app background
  secondary: '#FFFFFF', // cards / sheets
  tertiary: tint,       // role-tinted elevated surface
});

// ── 🔴 Wholesale (B2B) — Pink ─────────────────────────────
export const ColorsWholesale: Palette = {
  primary: '#FF4D8D',
  primaryDark: '#E0306F',
  primaryLight: '#FFB3C6',

  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  secondaryLight: '#E3F2FD',

  accent: '#4CAF50', // growth / trend
  accentDark: '#388E3C',
  accentLight: '#E3F8E8',

  error: NEUTRAL.error,
  errorDark: NEUTRAL.errorDark,
  errorLight: NEUTRAL.errorLight,
  success: NEUTRAL.success,
  warning: NEUTRAL.warning,
  info: NEUTRAL.info,

  background: lightBg('#FFE6EF'),
  text: { ...NEUTRAL.text },
  border: { ...NEUTRAL.border },

  status: { ...NEUTRAL.status },

  shadow: { ...NEUTRAL.shadowBase, cyan: 'rgba(255, 77, 141, 0.25)' },

  gradients: {
    premium: ['#FF4D8D', '#FFB3C6'],
    cyan: ['#4CAF50', '#A8E6CF'],
    dark: ['#FFFFFF', '#F1F5F9'],
    glow: ['#FFE6EF', '#FFFFFF'],
  },
};

// ── 🔵 Retailer — Blue ────────────────────────────────────
export const ColorsRetailer: Palette = {
  primary: '#2196F3',
  primaryDark: '#0D47A1',
  primaryLight: '#E3F2FD',

  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  secondaryLight: '#E3F8E8',

  accent: '#FFB74D', // amber / orange
  accentDark: '#FB8C00',
  accentLight: '#FFF3E0',

  error: NEUTRAL.error,
  errorDark: NEUTRAL.errorDark,
  errorLight: NEUTRAL.errorLight,
  success: NEUTRAL.success,
  warning: NEUTRAL.warning,
  info: NEUTRAL.info,

  background: lightBg('#E3F2FD'),
  text: { ...NEUTRAL.text },
  border: { ...NEUTRAL.border },

  status: { ...NEUTRAL.status },

  shadow: { ...NEUTRAL.shadowBase, cyan: 'rgba(33, 150, 243, 0.25)' },

  gradients: {
    premium: ['#2196F3', '#64B5F6'],
    cyan: ['#64B5F6', '#2196F3'],
    dark: ['#FFFFFF', '#F1F5F9'],
    glow: ['#E3F2FD', '#FFFFFF'],
  },
};

// ── 🟢 Customer (Shop) — Green ────────────────────────────
export const ColorsCustomer: Palette = {
  primary: '#4CAF50',
  primaryDark: '#1B5E20',
  primaryLight: '#EBF5E9',

  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  secondaryLight: '#E3F2FD',

  accent: '#FFB300', // amber / yellow
  accentDark: '#FF8F00',
  accentLight: '#FFF3E0',

  error: NEUTRAL.error,
  errorDark: NEUTRAL.errorDark,
  errorLight: NEUTRAL.errorLight,
  success: NEUTRAL.success,
  warning: NEUTRAL.warning,
  info: NEUTRAL.info,

  background: lightBg('#EBF5E9'),
  text: { ...NEUTRAL.text },
  border: { ...NEUTRAL.border },

  status: { ...NEUTRAL.status },

  shadow: { ...NEUTRAL.shadowBase, cyan: 'rgba(76, 175, 80, 0.25)' },

  gradients: {
    premium: ['#4CAF50', '#81C784'],
    cyan: ['#81C784', '#4CAF50'],
    dark: ['#FFFFFF', '#F1F5F9'],
    glow: ['#EBF5E9', '#FFFFFF'],
  },
};

export type Role = 'customer' | 'b2b' | 'supplier' | 'admin';

export const PaletteForRole: Record<Role, Palette> = {
  b2b: ColorsWholesale,
  supplier: ColorsRetailer,
  admin: ColorsRetailer,
  customer: ColorsCustomer,
};

// Default palette (unauthenticated / fallback) — Customer green.
export const Colors: Palette = ColorsCustomer;
