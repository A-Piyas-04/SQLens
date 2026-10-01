import { memo } from "react";
import type { ColumnSpec, GridItem, RowMark } from "./animation/stageAnimationTypes";
import PlaybackGridCell from "./PlaybackGridCell";

type RowItem = Extract<GridItem, { kind: "row" }>;

type Props = {
  item: RowItem;
  columns: ColumnSpec[];
  columnsKey: string;
  showRowId: boolean;
};

const MARK_GLYPH: Record<RowMark, { glyph: string; label: string }> = {
  testing: { glyph: "?", label: "Being evaluated" },
  pass: { glyph: "✓", label: "Passes" },
  fail: { glyph: "✕", label: "Fails — removed" },
  cut: { glyph: "✕", label: "Beyond the cutoff — removed" },
  focus: { glyph: "•", label: "In focus" },
};

/**
 * A stable playback row: keyed by `_rowId` by its parent, state is expressed
 * through `data-*` attributes so status changes never remount the node.
 */
const PlaybackGridRow = memo(
  function PlaybackGridRow({ item, columns, showRowId }: Props) {
    const { row, mark, groupIndex, hint } = item;
    const glyph = mark ? MARK_GLYPH[mark] : null;
    return (
      <div
        role="row"
        data-flip-id={item.id}
        data-row-id={item.id}
        data-mark={mark}
        data-group={groupIndex === undefined ? undefined : groupIndex % 6}
        className="pb-grid-row"
      >
        <div role="cell" className="pb-gutter" aria-label={glyph?.label ?? (hint ? `Moved ${hint}` : undefined)}>
          {glyph ? (
            <span aria-hidden>{glyph.glyph}</span>
          ) : hint ? (
            <span aria-hidden className="pb-hint">{hint === "up" ? "↑" : "↓"}</span>
          ) : null}
        </div>
        {showRowId && (
          <div role="cell" className="pb-cell pb-cell-id">
            #{row._rowId.replace("row-", "r")}
          </div>
        )}
        {columns.map((c) => (
          <PlaybackGridCell key={c.key} col={c.key} mark={c.mark} value={row[c.key]} />
        ))}
      </div>
    );
  },
  (a, b) =>
    a.item.row === b.item.row &&
    a.item.mark === b.item.mark &&
    a.item.groupIndex === b.item.groupIndex &&
    a.item.hint === b.item.hint &&
    a.columnsKey === b.columnsKey &&
    a.showRowId === b.showRowId
);

export default PlaybackGridRow;
