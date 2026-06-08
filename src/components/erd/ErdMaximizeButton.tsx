import { Panel } from "@xyflow/react";
import { Maximize2 } from "lucide-react";

import { buildErdFullscreenUrl } from "../../lib/erd/erdFullscreenUrl";
import Button from "../common/Button";

type Props = {
  projectId: string;
};

export default function ErdMaximizeButton({ projectId }: Props) {
  function handleOpenFullscreen() {
    window.open(
      buildErdFullscreenUrl(projectId),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Panel position="top-left" className="!m-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenFullscreen}
        aria-label="Open ERD fullscreen in new tab"
        title="Open fullscreen in new tab"
      >
        <Maximize2 className="size-3.5" aria-hidden />
      </Button>
    </Panel>
  );
}
