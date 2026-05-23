import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { keymap, type ViewUpdate } from "@codemirror/view";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

import Panel from "../common/Panel";
import { QueryToolbarHint } from "../features/QueryToolbar";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  onRun?: () => void;
  /** Run / Reset controls rendered in the panel header (top right) */
  toolbar?: ReactNode;
  hasSelection?: boolean;
};

export default function SqlEditor({
  value,
  onChange,
  onSelectionChange,
  onRun,
  toolbar,
  hasSelection = false,
}: Props) {
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  const extensions = useMemo(
    () => [
      sql(),
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRunRef.current?.();
            return true;
          },
        },
      ]),
    ],
    []
  );

  function handleUpdate(update: ViewUpdate) {
    if (update.selectionSet || update.docChanged) {
      const { main } = update.state.selection;
      const text =
        main.from === main.to
          ? ""
          : update.state.sliceDoc(main.from, main.to);
      onSelectionChange?.(text);
    }
  }

  return (
    <Panel title="SQL Editor" action={toolbar} interactive>
      <div className="overflow-hidden rounded-lg border border-slate-700/80 transition-colors duration-200 hover:border-slate-600/80">
        <CodeMirror
          value={value}
          height="300px"
          extensions={extensions}
          theme="dark"
          onChange={onChange}
          onUpdate={handleUpdate}
        />
      </div>
      <QueryToolbarHint hasSelection={hasSelection} />
    </Panel>
  );
}
