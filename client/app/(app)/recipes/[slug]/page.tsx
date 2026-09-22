import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RecipeView } from '@/components/recipes/RecipeView';
import { ServerApiError, serverFetch, serverFetchOrNull } from '@/lib/api/server';
import { requireCompleteProfile } from '@/lib/auth';
import { quarter } from '@/lib/recipeFormat';
import type { PlanPreferences, Recipe } from '@/lib/types';

export async function generateMetadata(props: PageProps<'/recipes/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await serverFetchOrNull<{ recipe: Recipe }>(`/recipes/${encodeURIComponent(slug)}`).catch(() => null);
  return { title: data ? `${data.recipe.name} recipe` : 'Recipe', robots: { index: false } };
}

/** `?servings=1.5` opens the recipe at a plan's portion (from a meal row); anything odd falls back to one. */
function servingsFrom(value: string | string[] | undefined): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.min(12, Math.max(0.25, Math.round(parsed * 4) / 4));
}

export default async function RecipePage(props: PageProps<'/recipes/[slug]'>) {
  await requireCompleteProfile();
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);

  let recipe: Recipe;
  let favourite = false;
  try {
    ({ recipe, favourite } = await serverFetch<{ recipe: Recipe; favourite: boolean }>(`/recipes/${encodeURIComponent(slug)}`));
  } catch (error) {
    if (error instanceof ServerApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
  const { preferences } = await serverFetch<{ preferences: PlanPreferences }>('/profile/preferences');

  const servings = servingsFrom(searchParams.servings);
  const fromPlan = searchParams.servings !== undefined && servings !== 1;
  const people = Number(searchParams.people);

  return (
    <div>
      <Link
        href="/recipes"
        className="no-print mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All recipes
      </Link>
      <RecipeView
        recipe={recipe}
        favourite={favourite}
        initialServings={servings}
        servingsNote={
          fromPlan
            ? Number.isInteger(people) && people > 1
              ? `Scaled to your plan: ${quarter(servings)} servings in all for ${people} people.`
              : `Scaled to the portion in your plan (${quarter(servings)}× the recipe).`
            : null
        }
        jainByDefault={preferences.jain}
      />
    </div>
  );
}
