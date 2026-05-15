// ============================================================
//  App Color System — "Deep Ocean" Theme
//  Navy Blue + Vivid Cyan + Pearl White
//
//  HOW TO USE:
//   import { Colors } from '@/constants/Colors';
//   backgroundColor: Colors.background.primary
//
//  To change the entire app theme, only edit this file.
// ============================================================

export const Colors = {
  // ── Primary Palette ─────────────────────────────────────
  primary: '#00B4D8',      // Vivid Cyan   – main interactive color
  primaryDark: '#0077B6',  // Ocean Blue   – pressed/dark variant
  primaryLight: '#90E0EF', // Ice Blue     – light tint / muted accent

  // ── Secondary / Highlight ───────────────────────────────
  secondary: '#00B4D8',    // Vivid Cyan   (same as primary for consistency)
  secondaryDark: '#0096C7',
  secondaryLight: '#CAF0F8', // Pale Cyan

  // ── Accent ──────────────────────────────────────────────
  accent: '#48CAE4',        // Sky Cyan     – icons, underlines, highlights
  accentDark: '#0096C7',
  accentLight: '#ADE8F4',   // Soft Cyan glow

  // ── Semantic Colors ─────────────────────────────────────
  error: '#EF4444',
  errorDark: '#DC2626',
  errorLight: '#FCA5A5',

  success: '#22C55E',
  warning: '#F59E0B',
  info: '#00B4D8',

  // ── Backgrounds ─────────────────────────────────────────
  background: {
    primary: '#0A0F1E',    // Deep Navy      – app background
    secondary: '#111827',  // Dark Slate     – cards, sheets, panels
    tertiary: '#1C2A40',   // Midnight Blue  – elevated surfaces
  },

  // ── Text ────────────────────────────────────────────────
  text: {
    primary: '#E8F4FD',    // Pearl White    – headlines, body text
    secondary: '#FFFFFF',  // Pure White     – high-emphasis text
    tertiary: '#7EA8C4',   // Muted Cyan     – placeholders, subtitles
    inverse: '#0A0F1E',    // Dark navy      – text on bright buttons
  },

  // ── Borders ─────────────────────────────────────────────
  border: {
    light: '#1C2A40',      // Subtle edge
    medium: '#1E2D4A',     // Standard card border
    dark: '#2A3F5F',       // Emphasized divider
  },

  // ── Order / Status ──────────────────────────────────────
  status: {
    pending: '#F59E0B',
    processing: '#00B4D8',
    shipped: '#0096C7',
    delivered: '#22C55E',
    cancelled: '#EF4444',
    refunded: '#F97316',
  },

  // ── Shadows ─────────────────────────────────────────────
  shadow: {
    light: 'rgba(0, 10, 30, 0.4)',
    medium: 'rgba(0, 10, 30, 0.7)',
    dark: 'rgba(0, 10, 30, 0.9)',
    cyan: 'rgba(0, 180, 216, 0.25)', // Glowing cyan shadow for buttons
  },

  // ── Gradients ───────────────────────────────────────────
  gradients: {
    premium: ['#00B4D8', '#0077B6'] as [string, string],  // Cyan → Ocean Blue
    cyan:    ['#48CAE4', '#00B4D8'] as [string, string],  // Sky → Vivid Cyan
    dark:    ['#111827', '#0A0F1E'] as [string, string],  // Slate → Deep Navy
    glow:   ['#0A0F1E', '#0E2040'] as [string, string],  // Dark glow card
  },
};
