type Props = {
  isVisible: boolean;
};

export default function LoadingBanner({ isVisible }: Props) {
  if (!isVisible) return null;

  return (
    <div className="bg-slate-900 border border-blue-800 text-blue-200 rounded-lg p-4 font-mono text-sm">
      <div className="animate-pulse">
        postgres@browser:~$ executing query...
      </div>
    </div>
  );
}
