import { forwardRef, type Ref } from "react";

import SqlEditor, { type SqlEditorHandle } from "../../../components/editor/SqlEditor";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  onRun?: () => void;
  hasSelection?: boolean;
};

const Sql50EditorPanel = forwardRef<SqlEditorHandle, Props>(
  function Sql50EditorPanel(
    { value, onChange, onSelectionChange, onRun, hasSelection },
    ref: Ref<SqlEditorHandle>
  ) {
    return (
      <SqlEditor
        ref={ref}
        value={value}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        onRun={onRun}
        hasSelection={hasSelection}
        hideTitle
        editorHeight="240px"
      />
    );
  }
);

export default Sql50EditorPanel;
