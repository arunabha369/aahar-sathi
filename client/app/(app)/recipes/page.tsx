import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/Card';
import { RecipeBrowser } from '@/components/recipes/RecipeBrowser';
import { serverFetch } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import type { RecipeListResponse } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Recipes',
  robots: { index: false },
};

export default async function RecipesPage() {
  await requireCompleteProfile();
  const { recipes, favourites } = await serverFetch<RecipeListResponse>('/recipes');

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Cookbook"
        title="Recipes"
        description={`Step-by-step recipes for all ${recipes.length} dishes in your plans, including vrat and iftar food. Amounts are for one serving as planned — scale them on each recipe.`}
      />
      <RecipeBrowser recipes={recipes} favourites={favourites} />
    </div>
  );
}
