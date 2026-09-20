import type { GroceryGroup } from '@/lib/types';

/** Only ever shown on paper: the week's shopping list, printed with the plan. */
export function PrintGrocery({ groups, total }: { groups: GroceryGroup[]; total: number }) {
  return (
    <section className="hidden print:block" data-print="card">
      <h2 className="mb-2 text-lg font-bold text-ink">Grocery list for the week ({total} items)</h2>
      <div className="grid grid-cols-2 gap-4">
        {groups.map((group) => (
          <div key={group.category} data-print="card" className="break-inside-avoid">
            <h3 className="text-sm font-bold text-ink">{group.category}</h3>
            <ul className="mt-1 text-sm text-ink">
              {group.items.map((item) => (
                <li key={item}>☐ {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
