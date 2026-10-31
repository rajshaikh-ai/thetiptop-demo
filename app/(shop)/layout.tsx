import { BottomNav, CartBar, DemoRibbon, ShopHeader } from '@/components/ShopChrome';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoRibbon />
      <ShopHeader />
      <main className="mx-auto min-h-[70vh] max-w-5xl pb-40 md:pb-28">{children}</main>
      <CartBar />
      <BottomNav />
    </>
  );
}
