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
        description={`All ${recipes.length} dishes, step by step — scale any recipe to the number of servings you are cooking.`}
      />
      <RecipeBrowser recipes={recipes} favourites={favourites} />
    </div>
  );
}
