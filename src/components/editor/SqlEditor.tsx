import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";

import Panel from "../common/Panel";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SqlEditor({ value, onChange }: Props) {
  return (
    <Panel title="SQL Editor" interactive>
      <div className="overflow-hidden rounded-lg border border-slate-700/80 transition-colors duration-200 hover:border-slate-600/80">
        <CodeMirror
          value={value}
          height="300px"
          extensions={[sql()]}
          theme="dark"
          onChange={onChange}
        />
      </div>
    </Panel>
  );
}
