import type { Metadata } from 'next';
import { PrivacyView } from './PrivacyView';

export const metadata: Metadata = {
  title: 'Privacy Policy — SATHUN GLOBAL',
  description:
    'Comprehensive Privacy Policy explaining personal data collection, GDPR legal bases, international transfers, cookie controls, and data-protection rights across the SATHUN Global Marketplace.',
};

export default function PrivacyPage() {
  return <PrivacyView />;
}
