import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Palette, PaletteForRole, Colors as DefaultPalette, Role } from '@/constants/Colors';

const ThemeContext = createContext<Palette>(DefaultPalette);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  const palette = useMemo<Palette>(() => {
    const role = profile?.role as Role | undefined;
    return (role && PaletteForRole[role]) || DefaultPalette;
  }, [profile?.role]);

  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the active color palette for the signed-in user's role.
 * Shape is identical to the `Palette` type / legacy `Colors` object,
 * so usage like `Colors.background.primary` works unchanged.
 */
export const useTheme = (): Palette => useContext(ThemeContext);
