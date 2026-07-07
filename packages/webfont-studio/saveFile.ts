type SaveBlobOptions = {
  blob: Blob;
  suggestedName: string;
  description: string;
  extension: string;
  mimeType: string;
};

const triggerAnchorDownload = (blob: Blob, suggestedName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = suggestedName;
  anchor.rel = "noopener";
  anchor.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};

export const saveBlobFile = async (options: SaveBlobOptions): Promise<boolean> => {
  const { blob, suggestedName, description, extension, mimeType } = options;

  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description,
            accept: { [mimeType]: [`.${extension}`] },
          },
        ],
      });
      const writable = await handle.createWritable();

      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }
    }
  }

  triggerAnchorDownload(blob, suggestedName);
  return true;
};

export const isMacOS = (): boolean =>
  /Mac|iPhone|iPad|iPod/u.test(navigator.userAgent) ||
  (navigator.platform !== undefined && /Mac/u.test(navigator.platform));
