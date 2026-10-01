import { memo } from "react";
import { cn } from "../../../lib/utils/cn";
import type { ColumnMark } from "./animation/stageAnimationTypes";

type Props =
  | { header: true; col: string; mark?: ColumnMark; value?: undefined }
  | { header?: false; col: string; mark?: ColumnMark; value: unknown };

function display(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** One playback grid cell; header and body cells share `data-col` so columns animate together. */
const PlaybackGridCell = memo(function PlaybackGridCell(props: Props) {
  const { col, mark } = props;
  if (props.header) {
    return (
      <div
        role="columnheader"
        data-col={col}
        data-col-mark={mark}
        title={col}
        className="pb-cell pb-cell-header"
      >
        {col}
        {mark === "dropped" && <span className="sr-only"> (dropped)</span>}
      </div>
    );
  }
  const isNull = props.value === null || props.value === undefined;
  const text = display(props.value);
  return (
    <div
      role="cell"
      data-col={col}
      data-col-mark={mark}
      title={text}
      className={cn("pb-cell", isNull && "pb-cell-null")}
    >
      {text}
    </div>
  );
});

export default PlaybackGridCell;
