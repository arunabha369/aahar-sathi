import type { ReactNode } from 'react';

export interface ChartKey {
  label: string;
  color: string;
  kind: 'line' | 'bar';
}

interface ChartFrameProps {
  title: string;
  /** Hide the visible title when the surrounding panel already names the chart. */
  hideTitle?: boolean;
  subtitle?: string;
  keys?: ChartKey[];
  /** Rendered visually — must sit inside a parent with a fixed height. */
  children: ReactNode;
  /** The same numbers as text, so nothing is locked behind colour or hover. */
  table: { caption: string; head: string[]; rows: (string | number)[][] };
  height?: string;
}

export function ChartFrame({ title, hideTitle = false, subtitle, keys, children, table, height = 'h-72' }: ChartFrameProps) {
  return (
    <figure className="m-0">
      <figcaption className={hideTitle && !subtitle && !keys?.length ? '' : 'mb-4'}>
        <h3 className={hideTitle ? 'sr-only' : 'text-base font-bold text-ink'}>{title}</h3>
        {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
        {keys?.length ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {keys.map((key) => (
              <li key={key.label} className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <span
                  aria-hidden="true"
                  className={key.kind === 'line' ? 'h-0.5 w-4 rounded-full' : 'size-2.5 rounded-sm'}
                  style={{ backgroundColor: key.color }}
                />
                {key.label}
              </li>
            ))}
          </ul>
        ) : null}
      </figcaption>
      <div className={height}>{children}</div>
      <div className="sr-only">
        <table>
          <caption>{table.caption}</caption>
          <thead>
            <tr>
              {table.head.map((heading) => (
                <th key={heading} scope="col">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th key={cellIndex} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function TooltipBox({ label, rows }: { label: string; rows: { name: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-line-strong bg-surface-3 px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-xs font-bold text-ink">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2 text-xs text-muted">
            {row.color ? (
              <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
            ) : null}
            <span>{row.name}</span>
            <span className="ml-auto font-semibold text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
