import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SqlEditor({ value, onChange }: Props) {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <CodeMirror
        value={value}
        height="300px"
        extensions={[sql()]}
        theme="dark"
        onChange={(value) => onChange(value)}
      />
    </div>
  );
}
