import {
  getNodesBounds,
  getViewportForBounds,
  type Edge,
  type Node,
} from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";

const EXPORT_PADDING = 80;
const BACKGROUND_COLOR = "#f4f1ec";
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2;

export type CaptureFormat = "png" | "svg";

function isEditorChrome(node: HTMLElement): boolean {
  return (
    node.classList?.contains("react-flow__controls") === true ||
    node.classList?.contains("react-flow__minimap") === true
  );
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export type CaptureOptions = {
  nodes: Node[];
  edges: Edge[];
  viewportElement: HTMLElement;
  format: CaptureFormat;
};

export type CaptureResult = {
  blob: Blob;
  width: number;
  height: number;
  dataUrl: string;
};

export async function captureErdViewport({
  nodes,
  viewportElement,
  format,
}: CaptureOptions): Promise<CaptureResult> {
  const bounds = getNodesBounds(nodes);
  const width = Math.ceil(bounds.width + EXPORT_PADDING * 2);
  const height = Math.ceil(bounds.height + EXPORT_PADDING * 2);

  const { x, y, zoom } = getViewportForBounds(
    bounds,
    width,
    height,
    MIN_ZOOM,
    MAX_ZOOM,
    0.15
  );

  const captureOptions = {
    backgroundColor: BACKGROUND_COLOR,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
    filter: (node: HTMLElement) => !isEditorChrome(node),
  };

  const dataUrl =
    format === "png"
      ? await toPng(viewportElement, captureOptions)
      : await toSvg(viewportElement, captureOptions);

  const blob = await dataUrlToBlob(dataUrl);

  return { blob, width, height, dataUrl };
}
