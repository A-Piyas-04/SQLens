import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { keymap, type ViewUpdate } from "@codemirror/view";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import Panel from "../common/Panel";
import { QueryToolbarHint } from "../features/QueryToolbar";

export type SqlEditorHandle = {
  insertAtCursor: (text: string) => void;
  focus: () => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  onRun?: () => void;
  toolbar?: ReactNode;
  hasSelection?: boolean;
  hideTitle?: boolean;
  editorHeight?: string;
};

const SqlEditor = forwardRef<SqlEditorHandle, Props>(function SqlEditor(
  {
    value,
    onChange,
    onSelectionChange,
    onRun,
    toolbar,
    hasSelection = false,
    hideTitle = false,
    editorHeight = "300px",
  },
  ref
) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const onRunRef = useRef(onRun);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useImperativeHandle(
    ref,
    () => ({
      insertAtCursor(text: string) {
        const view = cmRef.current?.view;
        if (!view) return;

        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        });
        view.focus();
        onChange(view.state.doc.toString());
      },
      focus() {
        cmRef.current?.view?.focus();
      },
    }),
    [onChange]
  );

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

  if (hideTitle) {
    return (
      <div data-tour="sql-editor">
        <div className="overflow-hidden rounded-sm border border-line bg-surface-inset transition-colors duration-200 hover:border-line-strong/70">
          <CodeMirror
            ref={cmRef}
            value={value}
            height={editorHeight}
            extensions={extensions}
            theme="light"
            onChange={onChange}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    );
  }

  return (
    <Panel
      title="SQL Editor"
      action={toolbar}
      interactive
      raised
      dataTour="sql-editor"
    >
      <div className="overflow-hidden rounded-sm border border-line bg-surface-inset transition-colors duration-200 hover:border-line-strong/70">
        <CodeMirror
          ref={cmRef}
          value={value}
          height={editorHeight}
          extensions={extensions}
          theme="light"
          onChange={onChange}
          onUpdate={handleUpdate}
        />
      </div>
      <QueryToolbarHint hasSelection={hasSelection} />
    </Panel>
  );
});

export default SqlEditor;
