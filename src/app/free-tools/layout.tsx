import PublicHeader from '@/components/landing/PublicHeader';
import PublicFooter from '@/components/landing/PublicFooter';

export default function FreeToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] -mt-6 flex w-screen flex-col overflow-x-hidden">
      <PublicHeader />
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">{children}</div>
      <PublicFooter />
    </div>
  );
}
