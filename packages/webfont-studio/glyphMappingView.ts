import {
  charToUnicodeHex,
  formatUnicodeLabel,
  type GlyphMappingRow,
  normalizeUnicodeHexInput,
  unicodeHexToChar,
} from "./glyphMapping";

export type GlyphMappingViewMode = "grid" | "list";

export type GlyphMappingChangeHandler = (rows: GlyphMappingRow[]) => void;

export type RenderGlyphMappingOptions = {
  rows: GlyphMappingRow[];
  viewMode: GlyphMappingViewMode;
  svgUrls: ReadonlyMap<string, string>;
  iconSizePx: number;
  onChange: GlyphMappingChangeHandler;
};

type RowFieldHandlers = {
  nameInput: HTMLInputElement;
  unicodeInput: HTMLInputElement;
  charInput: HTMLInputElement;
};

const attachSyncedUnicodeFields = (
  unicodeInput: HTMLInputElement,
  charInput: HTMLInputElement,
  initialHex: string,
  onHexChange: (hex: string) => void,
): void => {
  let syncing = false;

  const applyHex = (hex: string): void => {
    syncing = true;

    try {
      const normalized = normalizeUnicodeHexInput(hex);
      unicodeInput.value = formatUnicodeLabel(normalized);
      charInput.value = unicodeHexToChar(normalized);
      onHexChange(normalized);
    } catch {
      onHexChange(hex.replace(/^U\+/iu, ""));
    }

    syncing = false;
  };

  unicodeInput.addEventListener("input", () => {
    if (syncing) {
      return;
    }

    applyHex(unicodeInput.value.trim());
  });

  charInput.addEventListener("input", () => {
    if (syncing) {
      return;
    }

    const value = charInput.value;

    if (value.length === 0) {
      onHexChange("");
      return;
    }

    try {
      applyHex(charToUnicodeHex(value));
    } catch {
      onHexChange(charInput.value);
    }
  });

  applyHex(initialHex);
};

const createFieldLabel = (caption: string, input: HTMLInputElement): HTMLLabelElement => {
  const label = document.createElement("label");
  label.className = "mapping-field-label";

  const captionEl = document.createElement("span");
  captionEl.className = "mapping-field-caption";
  captionEl.textContent = caption;

  label.append(captionEl, input);
  return label;
};

const createRowFields = (
  row: GlyphMappingRow,
  index: number,
  rows: GlyphMappingRow[],
  onChange: GlyphMappingChangeHandler,
): RowFieldHandlers => {
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = row.name;
  nameInput.autocomplete = "off";
  nameInput.className = "mapping-input";

  const unicodeInput = document.createElement("input");
  unicodeInput.type = "text";
  unicodeInput.autocomplete = "off";
  unicodeInput.spellcheck = false;
  unicodeInput.className = "mapping-input mapping-input-unicode";
  unicodeInput.setAttribute("aria-label", "Unicode code point");

  const charInput = document.createElement("input");
  charInput.type = "text";
  charInput.maxLength = 8;
  charInput.autocomplete = "off";
  charInput.className = "mapping-input mapping-input-char";
  charInput.setAttribute("aria-label", "Character");

  const updateName = (): void => {
    onChange(
      rows.map((entry, entryIndex) => (entryIndex === index ? { ...entry, name: nameInput.value } : entry)),
    );
  };

  nameInput.addEventListener("input", updateName);

  attachSyncedUnicodeFields(unicodeInput, charInput, row.unicodeHex, (hex) => {
    onChange(rows.map((entry, entryIndex) => (entryIndex === index ? { ...entry, unicodeHex: hex } : entry)));
  });

  return { nameInput, unicodeInput, charInput };
};

const renderGridView = (container: HTMLElement, options: RenderGlyphMappingOptions): void => {
  const { rows, svgUrls, iconSizePx, onChange } = options;

  container.style.setProperty("--mapping-icon-size", `${iconSizePx}px`);
  container.innerHTML = "";

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const card = document.createElement("article");
    card.className = "glyph-mapping-card";

    const preview = document.createElement("div");
    preview.className = "mapping-svg-preview";

    const svgUrl = svgUrls.get(row.srcPath);

    if (svgUrl) {
      const img = document.createElement("img");
      img.src = svgUrl;
      img.alt = row.srcPath;
      img.className = "mapping-svg-image";
      preview.append(img);
    } else {
      preview.textContent = "SVG";
    }

    const file = document.createElement("p");
    file.className = "mapping-file-label";
    file.textContent = row.srcPath;
    file.title = row.srcPath;

    const { nameInput, unicodeInput, charInput } = createRowFields(row, index, rows, onChange);
    const nameLabel = createFieldLabel("Glyph name", nameInput);
    const unicodeLabel = createFieldLabel("Unicode", unicodeInput);
    const charLabel = createFieldLabel("Character", charInput);

    const fields = document.createElement("div");
    fields.className = "mapping-card-fields";
    fields.append(unicodeLabel, charLabel);

    card.append(preview, file, nameLabel, fields);
    container.append(card);
  }
};

const renderListView = (container: HTMLElement, options: RenderGlyphMappingOptions): void => {
  const { rows, onChange } = options;

  container.innerHTML = "";

  const header = document.createElement("li");
  header.className = "glyph-mapping-header";
  header.innerHTML = "<span>File</span><span>Glyph name</span><span>Unicode</span><span>Character</span>";
  container.append(header);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const item = document.createElement("li");
    item.className = "glyph-mapping-row";

    const file = document.createElement("span");
    file.className = "mapping-file";
    file.textContent = row.srcPath;
    file.title = row.srcPath;

    const nameLabel = document.createElement("label");
    nameLabel.className = "mapping-field";
    const { nameInput, unicodeInput, charInput } = createRowFields(row, index, rows, onChange);
    nameLabel.append(nameInput);

    const unicodeLabel = document.createElement("label");
    unicodeLabel.className = "mapping-field";
    unicodeLabel.append(unicodeInput);

    const charLabel = document.createElement("label");
    charLabel.className = "mapping-field";
    charLabel.append(charInput);

    item.append(file, nameLabel, unicodeLabel, charLabel);
    container.append(item);
  }
};

export const renderGlyphMapping = (
  gridContainer: HTMLElement,
  listContainer: HTMLElement,
  options: RenderGlyphMappingOptions,
): void => {
  const isGrid = options.viewMode === "grid";

  gridContainer.hidden = !isGrid;
  listContainer.hidden = isGrid;

  if (isGrid) {
    renderGridView(gridContainer, options);
    return;
  }

  renderListView(listContainer, options);
};
