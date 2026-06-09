import { forwardRef, useEffect, useRef, useState, type Ref } from "react";

import SqlEditor, { type SqlEditorHandle } from "../../../components/editor/SqlEditor";
import { SQL50_EDITOR_MIN_HEIGHT } from "../../../constants/layout";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [editorHeight, setEditorHeight] = useState(SQL50_EDITOR_MIN_HEIGHT);

    useEffect(() => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const observer = new ResizeObserver(([entry]) => {
        const nextHeight = Math.floor(entry.contentRect.height);
        setEditorHeight(
          nextHeight > 0 ? nextHeight : SQL50_EDITOR_MIN_HEIGHT
        );
      });

      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    return (
      <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
        <SqlEditor
          ref={ref}
          value={value}
          onChange={onChange}
          onSelectionChange={onSelectionChange}
          onRun={onRun}
          hasSelection={hasSelection}
          hideTitle
          editorHeight={`${editorHeight}px`}
        />
      </div>
    );
  }
);

export default Sql50EditorPanel;
