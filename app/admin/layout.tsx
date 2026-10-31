import type { Metadata, Viewport } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = { title: 'TipTop Owner Dashboard (demo)' };
export const viewport: Viewport = { themeColor: '#1F1A17' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
