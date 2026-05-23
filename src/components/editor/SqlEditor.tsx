import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { keymap, type ViewUpdate } from "@codemirror/view";
import { useEffect, useMemo, useRef } from "react";

import Panel from "../common/Panel";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  onRun?: () => void;
};

export default function SqlEditor({
  value,
  onChange,
  onSelectionChange,
  onRun,
}: Props) {
  // Stable ref so the keymap extension never stales across renders
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  // Extensions are created once — keymap reads from the ref at call time
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
    <Panel title="SQL Editor" interactive>
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
    </Panel>
  );
}
