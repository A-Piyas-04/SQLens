import { jsPDF } from "jspdf";

import { captureErdViewport, type CaptureOptions } from "./captureErdViewport";

export async function exportErdPdf(
  options: Omit<CaptureOptions, "format">
): Promise<void> {
  const { dataUrl, width, height } = await captureErdViewport({
    ...options,
    format: "png",
  });

  const orientation = width >= height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save("erd-diagram.pdf");
}
