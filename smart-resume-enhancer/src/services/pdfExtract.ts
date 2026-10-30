import * as pdfjs from "pdfjs-dist";

// Bundled worker (no CDN fetch).
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

/**
 * Extracts text from a PDF, keeping line breaks and appending embedded hyperlink URLs
 * (LinkedIn/GitHub links are usually annotations, not text, so plain text extraction loses them).
 */
export async function extractPdfText(file: File | Blob): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  const links = new Set<string>();

  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();

      let text = "";
      let lastY: number | null = null;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 2 && !text.endsWith("\n")) text += "\n";
        text += item.str;
        if (item.hasEOL) text += "\n";
        else if (item.str && !text.endsWith(" ")) text += " ";
        lastY = y;
      }
      pages.push(text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim());

      for (const a of await page.getAnnotations()) {
        const url: string | undefined = a.url ?? a.unsafeUrl;
        if (a.subtype === "Link" && url) links.add(url);
      }
    }
  } finally {
    await pdf.destroy();
  }

  const body = pages.filter(Boolean).join("\n\n");
  return links.size ? `${body}\n\nLinks:\n${Array.from(links).join("\n")}` : body;
}
