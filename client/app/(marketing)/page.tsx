import { SiteHeader } from '@/components/marketing/SiteHeader';
import { Hero } from '@/components/marketing/Hero';
import { DishMarquee } from '@/components/marketing/DishMarquee';
import { HowItWorks, ProblemSolution } from '@/components/marketing/Story';
import { FeatureBento } from '@/components/marketing/Bento';
import { Faq, FinalCta, Method, Regions, SiteFooter } from '@/components/marketing/Closing';
import { DISHES } from '@/components/marketing/content';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <DishMarquee dishes={DISHES} />
        <ProblemSolution />
        <HowItWorks />
        <FeatureBento />
        <Regions />
        <Method />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
