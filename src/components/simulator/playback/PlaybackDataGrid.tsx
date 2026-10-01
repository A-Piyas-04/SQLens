import { memo, useMemo, type CSSProperties } from "react";
import type { GridViewState } from "./animation/stageAnimationTypes";
import PlaybackGridRow from "./PlaybackGridRow";
import PlaybackGridCell from "./PlaybackGridCell";

type Props = {
  view: GridViewState;
  showRowIds: boolean;
  label: string;
};

/**
 * Animation-friendly playback grid (CSS Grid with table roles). Every row
 * shares one `grid-template-columns`, so header and body cells stay aligned
 * and columns/rows can be moved with transforms only.
 */
const PlaybackDataGrid = memo(function PlaybackDataGrid({ view, showRowIds, label }: Props) {
  const { items, columns } = view;
  const columnsKey = useMemo(() => columns.map((c) => `${c.key}:${c.mark ?? ""}`).join("|"), [columns]);
  const template = [
    "var(--pb-gutter-w)",
    ...(showRowIds ? ["var(--pb-id-w)"] : []),
    ...columns.map(() => "minmax(var(--pb-col-min), 1fr)"),
  ].join(" ");
  const dataRowCount = items.filter((i) => i.kind === "row").length;

  if (columns.length === 0 && items.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-muted">No rows at this stage.</p>;
  }

  return (
    <div
      data-grid
      role="table"
      aria-label={label}
      aria-rowcount={dataRowCount + 1}
      aria-colcount={columns.length}
      data-phase={view.phase}
      className="pb-grid"
      style={{ "--pb-cols": template } as CSSProperties}
    >
      <div role="rowgroup">
        <div role="row" data-header-row data-grid-header className="pb-grid-row pb-grid-header">
          <div role="columnheader" className="pb-gutter" aria-label="Row status" />
          {showRowIds && (
            <div role="columnheader" className="pb-cell pb-cell-header pb-cell-id">
              id
            </div>
          )}
          {columns.map((c) => (
            <PlaybackGridCell key={c.key} header col={c.key} mark={c.mark} />
          ))}
        </div>
      </div>

      <div role="rowgroup" data-grid-body>
        {items.length === 0 && (
          <div role="row" className="pb-grid-row pb-grid-span">
            <div role="cell" className="pb-span-cell text-ink-muted">
              No rows at this stage.
            </div>
          </div>
        )}
        {items.map((item) => {
          switch (item.kind) {
            case "row":
              return (
                <PlaybackGridRow
                  key={item.id}
                  item={item}
                  columns={columns}
                  columnsKey={columnsKey}
                  showRowId={showRowIds}
                />
              );
            case "group":
              return (
                <div
                  key={item.id}
                  role="row"
                  data-flip-id={item.id}
                  data-group={item.groupIndex % 6}
                  className="pb-grid-row pb-grid-span pb-group-header"
                >
                  <div role="cell" className="pb-span-cell">
                    <span className="pb-group-label">{item.label}</span>
                    <span className="pb-group-count">
                      {item.count} row{item.count === 1 ? "" : "s"}
                    </span>
                    {item.aggregates?.map((agg) => (
                      <span key={agg.label} data-agg className="pb-agg">
                        <span className="pb-agg-label">{agg.label}</span>
                        <span className="pb-agg-expr">{agg.expression}</span>
                        {agg.result !== null && (
                          <>
                            <span aria-hidden>→</span>
                            <span className="pb-agg-result">{agg.result}</span>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            case "cutoff":
              return (
                <div key={item.id} role="row" data-flip-id={item.id} className="pb-grid-row pb-grid-span pb-cutoff">
                  <div role="cell" className="pb-span-cell">
                    {item.label}
                  </div>
                </div>
              );
            case "summary":
              return (
                <div key={item.id} role="row" data-flip-id={item.id} data-summary className="pb-grid-row pb-grid-span pb-summary">
                  <div role="cell" className="pb-span-cell">
                    {item.label}
                  </div>
                </div>
              );
          }
        })}
      </div>
    </div>
  );
});

export default PlaybackDataGrid;
