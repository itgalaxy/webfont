import { fileSorter } from "@webfont/lib/svgicons2svgfont";
import type { Format } from "@webfont/types/Format";
import type { GlyphInput } from "@webfont/types/GlyphInput";
import {
  CUSTOM_FORMAT_OPTIONS,
  FORMAT_LABELS,
  type FormatMode,
  formatListLabel,
  RECOMMENDED_FAST_FORMATS,
} from "./formats";
import {
  formatUnicodeLabel,
  type GlyphMappingRow,
  glyphMappingsToMetadata,
  validateGlyphMappings,
} from "./glyphMapping";
import { type GlyphMappingViewMode, renderGlyphMapping } from "./glyphMappingView";
import { isMacOS, saveBlobFile } from "./saveFile";
import {
  clearSelectionSession,
  glyphMappingsForRestore,
  persistSelectionSession,
  readSelectionSession,
  storedSvgFilesToFileList,
} from "./selectionSession";
import type { StudioSvgToolsOptions } from "./studioSvgTools";
import {
  getWoff2WarmupState,
  startWoff2Warmup,
  subscribeWoff2Warmup,
  type Woff2WarmupState,
} from "./warmupClient";
import { createWizard, type WizardStepId } from "./wizard";
import { ConversionCancelledError, convertInWorker, isConversionCancelledError } from "./workerClient";
import {
  CONVERSION_STEPS,
  type ConversionStepId,
  type GlyphPreview,
  type WorkerConversionResult,
} from "./workerProtocol";

type DownloadEntry = {
  blob: Blob;
  filename: string;
  description: string;
  extension: string;
  mimeType: string;
};

let glyphMappingRows: GlyphMappingRow[] = [];
let mappingViewMode: GlyphMappingViewMode = "grid";
let mappingIconSizePx = 48;
const svgPreviewUrls = new Map<string, string>();
let svgPreviewDark = false;
let selectedSvgFiles: File[] = [];
let hasConversionResults = false;
let currentDownloadEntries = new Map<Format, DownloadEntry>();

const stepSelectEl = document.querySelector<HTMLElement>("#step-select");
const stepMapEl = document.querySelector<HTMLElement>("#step-map");
const stepConvertEl = document.querySelector<HTMLElement>("#step-convert");
const stepResultsEl = document.querySelector<HTMLElement>("#step-results");
const sidebarSelectEl = document.querySelector<HTMLElement>("#sidebar-select");
const sidebarMapEl = document.querySelector<HTMLElement>("#sidebar-map");
const sidebarConvertEl = document.querySelector<HTMLElement>("#sidebar-convert");
const sidebarResultsEl = document.querySelector<HTMLElement>("#sidebar-results");
const wizardStepperEl = document.querySelector<HTMLOListElement>("#wizard-stepper");
const wizardBackButton = document.querySelector<HTMLButtonElement>("#wizard-back");
const wizardNextButton = document.querySelector<HTMLButtonElement>("#wizard-next");
const wizardNavHintEl = document.querySelector<HTMLParagraphElement>("#wizard-nav-hint");

const fileInput = document.querySelector<HTMLInputElement>("#svg-files");
const dropZoneEl = document.querySelector<HTMLElement>("#drop-zone");
const convertIdleEl = document.querySelector<HTMLElement>("#convert-idle");
const glyphMappingGridEl = document.querySelector<HTMLElement>("#glyph-mapping-grid");
const glyphMappingListEl = document.querySelector<HTMLUListElement>("#glyph-mapping-list");
const glyphMappingErrorEl = document.querySelector<HTMLParagraphElement>("#glyph-mapping-error");
const mappingViewGridInput = document.querySelector<HTMLInputElement>("#mapping-view-grid");
const mappingViewListInput = document.querySelector<HTMLInputElement>("#mapping-view-list");
const mappingIconSizeInput = document.querySelector<HTMLInputElement>("#mapping-icon-size");
const mappingIconSizeValueEl = document.querySelector<HTMLSpanElement>("#mapping-icon-size-value");
const svgPreviewDarkInputs = document.querySelectorAll<HTMLInputElement>(".svg-preview-dark-input");
const convertButton = document.querySelector<HTMLButtonElement>("#convert");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");
const selectionSection = document.querySelector<HTMLElement>("#selection");
const selectionSummaryEl = document.querySelector<HTMLParagraphElement>("#selection-summary");
const fileListEl = document.querySelector<HTMLUListElement>("#file-list");
const clearSelectionButton = document.querySelector<HTMLButtonElement>("#clear-selection");
const formatModeFastInput = document.querySelector<HTMLInputElement>("#format-mode-fast");
const formatModeCustomInput = document.querySelector<HTMLInputElement>("#format-mode-custom");
const formatPickerSection = document.querySelector<HTMLElement>("#format-picker");
const formatWoff2Input = document.querySelector<HTMLInputElement>("#format-woff2");
const woff2WarmupNoticeEl = document.querySelector<HTMLParagraphElement>("#woff2-warmup-notice");
const formatCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="output-format"]');
const layoutNormalizeInput = document.querySelector<HTMLInputElement>("#layout-normalize");
const layoutCenterHorizontallyInput = document.querySelector<HTMLInputElement>("#layout-center-horizontally");
const layoutFixedWidthInput = document.querySelector<HTMLInputElement>("#layout-fixed-width");
const progressSection = document.querySelector<HTMLElement>("#progress");
const progressLabelEl = document.querySelector<HTMLParagraphElement>("#progress-label");
const progressPercentEl = document.querySelector<HTMLSpanElement>("#progress-percent");
const progressTrackEl = document.querySelector<HTMLElement>("#progress-track");
const progressBarEl = document.querySelector<HTMLDivElement>("#progress-bar");
const progressStepsEl = document.querySelector<HTMLOListElement>("#progress-steps");
const metaEl = document.querySelector<HTMLParagraphElement>("#meta");
const downloadsSection = document.querySelector<HTMLElement>("#downloads");
const downloadHintEl = document.querySelector<HTMLParagraphElement>("#download-hint");
const downloadListEl = document.querySelector<HTMLDivElement>("#download-list");
const glyphListEl = document.querySelector<HTMLUListElement>("#glyph-list");
const debugToggle = document.querySelector<HTMLInputElement>("#debug-toggle");
const svgDiagnoseToggle = document.querySelector<HTMLInputElement>("#svg-diagnose-toggle");
const svgFixToggle = document.querySelector<HTMLInputElement>("#svg-fix-toggle");
const debugPanel = document.querySelector<HTMLElement>("#debug-panel");
const debugLogEl = document.querySelector<HTMLPreElement>("#debug-log");
const workerStatusEl = document.querySelector<HTMLParagraphElement>("#worker-status");
const workerStatusDotEl = document.querySelector<HTMLSpanElement>("#worker-status-dot");

let fontObjectUrl: string | undefined;
const downloadObjectUrls: string[] = [];

const FONT_BASENAME = "webfont";

const sortSvgFileNames = (names: readonly string[]): string[] => [...names].sort(fileSorter);

const sortSvgFiles = (files: readonly File[]): File[] => {
  const byName = new Map(files.map((file) => [file.name, file]));

  return sortSvgFileNames(files.map((file) => file.name))
    .map((name) => byName.get(name))
    .filter((file): file is File => file !== undefined);
};

let wizard: ReturnType<typeof createWizard> | undefined;
let conversionAbortController: AbortController | undefined;
let conversionInProgress = false;

const CONVERT_BACK_CONFIRM_MESSAGE =
  "A conversion is in progress. Going back will cancel it. Do you want to leave this step?";

function isConversionRunning(): boolean {
  return conversionInProgress;
}

function assertConversionNotAborted(): void {
  if (conversionAbortController?.signal.aborted) {
    throw new ConversionCancelledError();
  }
}

function abortConversion(): void {
  conversionAbortController?.abort();
}

function hasSelectedFiles(): boolean {
  return selectedSvgFiles.length > 0;
}

function getWizardBlockReason(): string | undefined {
  const step = wizard?.getCurrentStep();

  if (step === "select" && !hasSelectedFiles()) {
    return "Select at least one .svg file to continue.";
  }

  if (step === "map") {
    if (!hasSelectedFiles()) {
      return "Select SVG files before mapping glyphs.";
    }

    const mappingError = glyphMappingRows.length > 0 ? validateGlyphMappings(glyphMappingRows) : undefined;

    if (mappingError) {
      return mappingError;
    }
  }

  if (step === "results" && !hasSelectedFiles()) {
    return "Select SVG files to edit the mapping.";
  }

  return undefined;
}

function syncWizardNavigation(): void {
  if (!wizard || !wizardNextButton) {
    return;
  }

  const hasFiles = hasSelectedFiles();
  const mappingError = glyphMappingRows.length > 0 ? validateGlyphMappings(glyphMappingRows) : undefined;

  wizard.syncNavigation({
    hasFiles,
    mappingValid: hasFiles && !mappingError,
    hasResults: hasConversionResults,
  });

  if (wizardNavHintEl) {
    const blockReason = getWizardBlockReason();
    const nextDisabled = wizardNextButton.disabled && !wizardNextButton.hidden;

    if (blockReason && nextDisabled) {
      wizardNavHintEl.textContent = blockReason;
      wizardNavHintEl.hidden = false;
    } else {
      wizardNavHintEl.hidden = true;
      wizardNavHintEl.textContent = "";
    }
  }
}

function syncSvgPreviewTheme(): void {
  document.documentElement.classList.toggle("svg-preview-dark", svgPreviewDark);

  for (const input of svgPreviewDarkInputs) {
    input.checked = svgPreviewDark;
  }
}

const DOWNLOAD_EXTENSIONS: Partial<Record<Format, string>> = {
  svg: "svg",
  ttf: "ttf",
  woff: "woff",
  woff2: "woff2",
};

const DOWNLOAD_MIME_TYPES: Partial<Record<Format, string>> = {
  svg: "image/svg+xml",
  ttf: "font/ttf",
  woff: "font/woff",
  woff2: "font/woff2",
};

const setStatus = (message: string, isError = false): void => {
  if (!statusEl) {
    return;
  }

  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
};

const revokeFontUrl = (): void => {
  if (fontObjectUrl) {
    URL.revokeObjectURL(fontObjectUrl);
    fontObjectUrl = undefined;
  }
};

const revokeDownloadUrls = (): void => {
  for (const url of downloadObjectUrls) {
    URL.revokeObjectURL(url);
  }

  downloadObjectUrls.length = 0;
};

const clearDownloads = (): void => {
  revokeDownloadUrls();
  currentDownloadEntries = new Map();

  if (downloadListEl) {
    downloadListEl.innerHTML = "";
  }

  if (downloadHintEl) {
    downloadHintEl.hidden = true;
    downloadHintEl.textContent = "";
  }

  if (downloadsSection) {
    downloadsSection.hidden = true;
  }
};

const saveDownloadEntry = async (format: Format): Promise<void> => {
  const entry = currentDownloadEntries.get(format);

  if (!entry) {
    return;
  }

  await saveBlobFile({
    blob: entry.blob,
    suggestedName: entry.filename,
    description: FORMAT_LABELS[format],
    extension: entry.extension,
    mimeType: entry.mimeType,
  });
};

const isDebugEnabled = (): boolean => Boolean(debugToggle?.checked);

const isSvgDiagnoseEnabled = (): boolean => Boolean(svgDiagnoseToggle?.checked);

const isSvgFixEnabled = (): boolean => Boolean(svgFixToggle?.checked);

const getSvgToolsOptions = (): StudioSvgToolsOptions | undefined => {
  const diagnose = isSvgDiagnoseEnabled();
  const fix = isSvgFixEnabled();

  if (!diagnose && !fix) {
    return undefined;
  }

  return {
    ...(diagnose ? { diagnose: true } : {}),
    ...(fix ? { fix: ["outline-stroke"] } : {}),
  };
};

const syncDebugPanelVisibility = (): void => {
  if (!debugPanel) {
    return;
  }

  debugPanel.hidden = !isDebugEnabled();
};

const clearDebugLog = (): void => {
  if (debugLogEl) {
    debugLogEl.textContent = "";
  }
};

const appendDebugLog = (message: string, elapsedMs?: number): void => {
  if (!debugLogEl || !isDebugEnabled()) {
    return;
  }

  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  let line = `[${timestamp}] ${message}`;

  if (elapsedMs !== undefined) {
    line += ` (+${Math.round(elapsedMs)} ms)`;
  }

  debugLogEl.textContent = debugLogEl.textContent ? `${debugLogEl.textContent}\n${line}` : line;
  debugLogEl.scrollTop = debugLogEl.scrollHeight;
};

const setWorkerStatus = (state: "idle" | "running" | "done" | "error", detail?: string): void => {
  if (workerStatusEl) {
    const labels = {
      idle: "Worker: idle (UI on main thread)",
      running: "Worker: processing conversion…",
      done: "Worker: finished",
      error: "Worker: error",
    };

    workerStatusEl.textContent = detail ?? labels[state];
  }

  workerStatusDotEl?.classList.remove("is-idle", "is-running", "is-done", "is-error");
  workerStatusDotEl?.classList.add(`is-${state}`);
};

const getFormatMode = (): FormatMode => (formatModeCustomInput?.checked ? "custom" : "recommended-fast");

const syncFormatPickerVisibility = (): void => {
  if (!formatPickerSection) {
    return;
  }

  formatPickerSection.hidden = getFormatMode() !== "custom";
};

const applyWoff2WarmupState = (state: Woff2WarmupState, detail?: string): void => {
  if (!formatWoff2Input || !woff2WarmupNoticeEl) {
    return;
  }

  if (state === "ready") {
    formatWoff2Input.disabled = false;
    woff2WarmupNoticeEl.hidden = true;
    appendDebugLog(detail ?? "WOFF2 WASM warmup complete");
    return;
  }

  if (state === "failed") {
    formatWoff2Input.disabled = true;
    formatWoff2Input.checked = false;
    woff2WarmupNoticeEl.hidden = false;
    woff2WarmupNoticeEl.classList.remove("is-ready");
    woff2WarmupNoticeEl.textContent = detail ?? "WOFF2 warmup failed. Reload the page to try again.";
    return;
  }

  formatWoff2Input.disabled = true;
  formatWoff2Input.checked = false;
  woff2WarmupNoticeEl.hidden = false;
  woff2WarmupNoticeEl.classList.remove("is-ready");
  woff2WarmupNoticeEl.textContent =
    "WOFF2 is unavailable while WASM loads in the background (this can take a few seconds).";
};

const getSelectedFormats = (): Format[] => {
  if (getFormatMode() === "recommended-fast") {
    return [...RECOMMENDED_FAST_FORMATS];
  }

  const selected = [...formatCheckboxes]
    .filter((checkbox) => checkbox.checked && !checkbox.disabled)
    .map((checkbox) => checkbox.value as Format);

  return CUSTOM_FORMAT_OPTIONS.filter((format) => selected.includes(format));
};

const getSvgIconLayoutOptions = (): {
  normalize: boolean;
  centerHorizontally: boolean;
  fixedWidth: boolean;
} => ({
  normalize: Boolean(layoutNormalizeInput?.checked),
  centerHorizontally: Boolean(layoutCenterHorizontallyInput?.checked),
  fixedWidth: Boolean(layoutFixedWidthInput?.checked),
});

const formatSvgIconLayoutDebug = (layout: ReturnType<typeof getSvgIconLayoutOptions>): string => {
  const enabled = [
    layout.normalize && "normalize",
    layout.centerHorizontally && "centerHorizontally",
    layout.fixedWidth && "fixedWidth",
  ].filter(Boolean);

  return enabled.length > 0 ? enabled.join(", ") : "default";
};

const isSvgFile = (file: File): boolean => {
  const name = file.name.toLowerCase();

  if (name.endsWith(".svg")) {
    return true;
  }

  if (file.type === "image/svg+xml" || file.type === "image/svg") {
    return true;
  }

  if (file.type === "") {
    return !/\.(png|jpe?g|gif|webp|ico|bmp|pdf|zip)$/iu.test(name);
  }

  return false;
};

const filterSvgFileArray = (files: readonly File[]): File[] => files.filter(isSvgFile);

const updateConvertButton = (hasFiles: boolean): void => {
  if (!convertButton) {
    return;
  }

  const mappingError = glyphMappingRows.length > 0 ? validateGlyphMappings(glyphMappingRows) : undefined;
  const ready = hasFiles && !mappingError;

  convertButton.disabled = !ready;
  convertButton.classList.toggle("is-ready", ready);
  syncWizardNavigation();
};

const syncGlyphMappingError = (): void => {
  if (!glyphMappingErrorEl) {
    return;
  }

  const error = validateGlyphMappings(glyphMappingRows);

  if (!error) {
    glyphMappingErrorEl.hidden = true;
    glyphMappingErrorEl.textContent = "";
    return;
  }

  glyphMappingErrorEl.hidden = false;
  glyphMappingErrorEl.textContent = error;
};

const revokeSvgPreviewUrls = (): void => {
  for (const url of svgPreviewUrls.values()) {
    URL.revokeObjectURL(url);
  }

  svgPreviewUrls.clear();
};

const buildSvgPreviewUrls = (files: readonly File[]): void => {
  revokeSvgPreviewUrls();

  for (const file of files) {
    svgPreviewUrls.set(file.name, URL.createObjectURL(file));
  }
};

const syncMappingIconSizeLabel = (): void => {
  if (mappingIconSizeValueEl) {
    mappingIconSizeValueEl.textContent = `${mappingIconSizePx}px`;
  }
};

const syncMappingToolbar = (): void => {
  const iconSizeControl = mappingIconSizeInput?.closest<HTMLElement>(".mapping-icon-size");
  if (iconSizeControl) {
    iconSizeControl.hidden = mappingViewMode === "list";
  }
};

const renderGlyphMappingPanel = (): void => {
  if (!glyphMappingGridEl || !glyphMappingListEl) {
    return;
  }

  if (glyphMappingRows.length === 0) {
    glyphMappingGridEl.innerHTML = "";
    glyphMappingListEl.innerHTML = "";
    syncGlyphMappingError();
    return;
  }

  renderGlyphMapping(glyphMappingGridEl, glyphMappingListEl, {
    rows: glyphMappingRows,
    viewMode: mappingViewMode,
    svgUrls: svgPreviewUrls,
    iconSizePx: mappingIconSizePx,
    onChange: (rows) => {
      glyphMappingRows = rows;
      syncGlyphMappingError();
      schedulePersistSelection();

      if (wizard?.getCurrentStep() === "map") {
        updateConvertButton(hasSelectedFiles());
      }
    },
  });

  syncGlyphMappingError();
  syncMappingToolbar();
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
};

const renderProgressSteps = (activeStep: ConversionStepId, completedSteps: readonly ConversionStepId[]): void => {
  if (!progressStepsEl) {
    return;
  }

  progressStepsEl.innerHTML = "";

  for (const step of CONVERSION_STEPS) {
    const item = document.createElement("li");
    item.className = "progress-step";

    if (completedSteps.includes(step.id)) {
      item.classList.add("is-done");
    }

    if (step.id === activeStep) {
      item.classList.add("is-active");
    }

    item.textContent = step.label;
    progressStepsEl.append(item);
  }
};

const setProgress = (
  label: string,
  percent: number,
  activeStep: ConversionStepId,
  completedSteps: readonly ConversionStepId[] = [],
): void => {
  progressTrackEl?.classList.remove("is-busy");
  progressBarEl?.classList.remove("is-indeterminate");

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  if (progressSection) {
    progressSection.hidden = false;
  }

  if (progressLabelEl) {
    progressLabelEl.textContent = label;
  }

  if (progressPercentEl) {
    progressPercentEl.textContent = `${clamped}%`;
  }

  if (progressBarEl) {
    progressBarEl.style.width = `${clamped}%`;
  }

  if (progressTrackEl) {
    progressTrackEl.setAttribute("aria-valuenow", String(clamped));
    progressTrackEl.setAttribute("aria-valuetext", `${clamped}% — ${label}`);
    progressTrackEl.removeAttribute("aria-busy");
  }

  renderProgressSteps(activeStep, completedSteps);
};

const setBusyProgress = (
  label: string,
  activeStep: ConversionStepId,
  completedSteps: readonly ConversionStepId[] = [],
): void => {
  if (progressSection) {
    progressSection.hidden = false;
  }

  if (progressLabelEl) {
    progressLabelEl.textContent = label;
  }

  if (progressPercentEl) {
    progressPercentEl.textContent = "…";
  }

  if (progressBarEl) {
    progressBarEl.style.width = "";
    progressBarEl.classList.add("is-indeterminate");
  }

  if (progressTrackEl) {
    progressTrackEl.classList.add("is-busy");
    progressTrackEl.setAttribute("aria-busy", "true");
    progressTrackEl.removeAttribute("aria-valuenow");
    progressTrackEl.setAttribute("aria-valuetext", label);
  }

  renderProgressSteps(activeStep, completedSteps);
};

const applyWorkerProgress = (update: {
  label: string;
  step: ConversionStepId;
  completedSteps: ConversionStepId[];
  percent?: number;
  busy?: boolean;
}): void => {
  if (isDebugEnabled()) {
    const suffix = update.busy ? " (in progress…)" : "";
    appendDebugLog(`Worker progress: ${update.label}${suffix}`);
  }

  if (update.busy || update.percent === undefined) {
    setBusyProgress(update.label, update.step, update.completedSteps);
    return;
  }

  setProgress(update.label, update.percent, update.step, update.completedSteps);
};

const showProgress = (): void => {
  if (progressSection) {
    progressSection.hidden = false;
  }

  if (convertIdleEl) {
    convertIdleEl.hidden = true;
  }

  setProgress("Preparing conversion…", 0, "read");
};

const hideProgress = (): void => {
  progressTrackEl?.classList.remove("is-busy");
  progressBarEl?.classList.remove("is-indeterminate");

  if (progressSection) {
    progressSection.hidden = true;
  }

  if (convertIdleEl) {
    convertIdleEl.hidden = false;
  }
};

function renderSelectionPanel(): void {
  if (!selectionSection || !selectionSummaryEl || !fileListEl) {
    return;
  }

  if (selectedSvgFiles.length === 0) {
    selectionSection.hidden = true;
    selectionSummaryEl.textContent = "";
    fileListEl.innerHTML = "";
    return;
  }

  selectionSection.hidden = false;

  const totalSize = selectedSvgFiles.reduce((sum, file) => sum + file.size, 0);
  const label = selectedSvgFiles.length === 1 ? "SVG file selected" : "SVG files selected";

  selectionSummaryEl.textContent = `${selectedSvgFiles.length} ${label} · ${formatFileSize(totalSize)} total`;

  const displayFiles = sortSvgFiles(selectedSvgFiles);

  fileListEl.innerHTML = "";
  for (const file of displayFiles) {
    const item = document.createElement("li");
    item.className = "file-list-item";

    const thumb = document.createElement("div");
    thumb.className = "file-thumb";
    const previewUrl = svgPreviewUrls.get(file.name);

    if (previewUrl) {
      const image = document.createElement("img");
      image.src = previewUrl;
      image.alt = "";
      image.className = "file-thumb-image";
      image.loading = "lazy";
      thumb.append(image);
    }

    const info = document.createElement("div");
    info.className = "file-info";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;
    name.title = file.name;

    const size = document.createElement("span");
    size.className = "file-size";
    size.textContent = formatFileSize(file.size);

    info.append(name, size);
    item.append(thumb, info);
    fileListEl.append(item);
  }
}

function ensureWizardReady(): void {
  if (!wizard) {
    initWizard();
  }
}

function syncWizardState(): void {
  ensureWizardReady();
  syncWizardNavigation();
  updateConvertButton(hasSelectedFiles());
}

function schedulePersistSelection(): void {
  if (selectedSvgFiles.length === 0) {
    return;
  }

  void persistSelectionSession(selectedSvgFiles, glyphMappingRows);
}

type ApplySelectedFilesOptions = {
  glyphMappings?: GlyphMappingRow[];
};

const applySelectedFiles = (files: readonly File[], options: ApplySelectedFilesOptions = {}): void => {
  const svgFiles = filterSvgFileArray(files);

  if (svgFiles.length === 0) {
    if (files.length > 0) {
      setStatus("No valid .svg files in the selection.", true);
    }

    return;
  }

  selectedSvgFiles = svgFiles;
  setStatus("");

  buildSvgPreviewUrls(svgFiles);

  const srcPaths = sortSvgFileNames(svgFiles.map((file) => file.name));
  glyphMappingRows = glyphMappingsForRestore(srcPaths, options.glyphMappings);
  hasConversionResults = false;

  renderSelectionPanel();
  wizard?.markStepReachable("map");
  syncWizardState();
  schedulePersistSelection();

  if (wizard?.getCurrentStep() === "map") {
    renderGlyphMappingPanel();
  }
};

async function restoreSelectionFromSession(): Promise<void> {
  const session = readSelectionSession();

  if (!session) {
    return;
  }

  applySelectedFiles(storedSvgFilesToFileList(session.files), {
    glyphMappings: session.glyphMappings,
  });
}

function clearSelection(): void {
  selectedSvgFiles = [];
  glyphMappingRows = [];
  hasConversionResults = false;

  revokeSvgPreviewUrls();
  revokeFontUrl();
  hideProgress();
  clearDebugLog();
  clearDownloads();
  setWorkerStatus("idle");

  if (fileInput) {
    fileInput.value = "";
  }

  renderSelectionPanel();

  if (glyphMappingGridEl) {
    glyphMappingGridEl.innerHTML = "";
  }

  if (glyphMappingListEl) {
    glyphMappingListEl.innerHTML = "";
  }

  if (glyphListEl) {
    glyphListEl.innerHTML = "";
  }

  if (metaEl) {
    metaEl.textContent = "";
  }

  syncGlyphMappingError();
  setStatus("");
  clearSelectionSession();
  wizard?.resetProgress();
  syncWizardState();
}

function initWizard(): void {
  if (
    !stepSelectEl ||
    !stepMapEl ||
    !stepConvertEl ||
    !stepResultsEl ||
    !sidebarSelectEl ||
    !sidebarMapEl ||
    !sidebarConvertEl ||
    !sidebarResultsEl ||
    !wizardStepperEl ||
    !wizardBackButton ||
    !wizardNextButton
  ) {
    return;
  }

  wizard = createWizard({
    elements: {
      stepper: wizardStepperEl,
      stagePanels: new Map<WizardStepId, HTMLElement>([
        ["select", stepSelectEl],
        ["map", stepMapEl],
        ["convert", stepConvertEl],
        ["results", stepResultsEl],
      ]),
      sidebarPanels: new Map<WizardStepId, HTMLElement>([
        ["select", sidebarSelectEl],
        ["map", sidebarMapEl],
        ["convert", sidebarConvertEl],
        ["results", sidebarResultsEl],
      ]),
      backButton: wizardBackButton,
      nextButton: wizardNextButton,
    },
    onStepChange: (step) => {
      if (step === "map" && glyphMappingRows.length > 0) {
        renderGlyphMappingPanel();
      }

      syncWizardNavigation();
    },
    onBeforeBack: (step) => {
      if (step !== "convert" || !isConversionRunning()) {
        return true;
      }

      if (!window.confirm(CONVERT_BACK_CONFIRM_MESSAGE)) {
        return false;
      }

      abortConversion();
      return true;
    },
  });
}

const readGlyphsFromFiles = async (): Promise<GlyphInput[]> => {
  const svgFiles = selectedSvgFiles;

  if (svgFiles.length === 0) {
    throw new Error("Select at least one .svg file");
  }

  const glyphs: GlyphInput[] = [];

  for (let index = 0; index < svgFiles.length; index += 1) {
    assertConversionNotAborted();

    const file = svgFiles[index];
    const readPercent = 5 + ((index + 1) / svgFiles.length) * 20;

    setProgress(`Reading ${file.name}…`, readPercent, "read");
    appendDebugLog(`Main thread: reading ${file.name}`);

    glyphs.push({
      contents: await file.text(),
      srcPath: file.name,
    });
  }

  appendDebugLog(`Main thread: read ${glyphs.length} file(s); posting job to worker`);
  return glyphs;
};

const injectFontFace = (outputs: WorkerConversionResult["outputs"]): void => {
  revokeFontUrl();

  let mimeType = "";
  let formatKeyword = "";
  let bytes: Uint8Array | undefined;

  if (outputs.woff2) {
    mimeType = "font/woff2";
    formatKeyword = "woff2";
    bytes = outputs.woff2;
  } else if (outputs.woff) {
    mimeType = "font/woff";
    formatKeyword = "woff";
    bytes = outputs.woff;
  } else if (outputs.ttf) {
    mimeType = "font/ttf";
    formatKeyword = "truetype";
    bytes = outputs.ttf;
  }

  if (!bytes) {
    return;
  }

  fontObjectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));

  let styleEl = document.querySelector<HTMLStyleElement>("#webfont-demo-face");

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "webfont-demo-face";
    document.head.append(styleEl);
  }

  styleEl.textContent = `@font-face {
  font-family: "webfont-demo";
  src: url("${fontObjectUrl}") format("${formatKeyword}");
  font-display: block;
}`;
};

const renderDownloads = (outputs: WorkerConversionResult["outputs"], formats: Format[]): void => {
  if (!downloadsSection || !downloadListEl) {
    return;
  }

  clearDownloads();
  downloadsSection.hidden = false;
  downloadListEl.innerHTML = "";

  if (downloadHintEl && isMacOS()) {
    downloadHintEl.hidden = false;
    downloadHintEl.textContent =
      "On macOS, browser downloads may be blocked by Gatekeeper when opened in Font Book. " +
      "Use Save and pick a folder, then right-click the file → Open the first time. " +
      "For websites, prefer WOFF or WOFF2 over installing TTF locally.";
  }

  for (const format of formats) {
    const extension = DOWNLOAD_EXTENSIONS[format];
    const mimeType = DOWNLOAD_MIME_TYPES[format];

    if (!extension || !mimeType) {
      continue;
    }

    let blob: Blob | undefined;

    if (format === "svg" && outputs.svg) {
      blob = new Blob([outputs.svg], { type: mimeType });
    } else if (format === "ttf" && outputs.ttf) {
      blob = new Blob([outputs.ttf], { type: "application/octet-stream" });
    } else if (format === "woff" && outputs.woff) {
      blob = new Blob([outputs.woff], { type: "application/octet-stream" });
    } else if (format === "woff2" && outputs.woff2) {
      blob = new Blob([outputs.woff2], { type: "application/octet-stream" });
    }

    if (!blob) {
      continue;
    }

    const filename = `${FONT_BASENAME}.${extension}`;
    currentDownloadEntries.set(format, {
      blob,
      filename,
      description: FORMAT_LABELS[format],
      extension,
      mimeType,
    });

    const button = document.createElement("button");
    button.type = "button";
    button.className = "download-link";
    button.textContent = `Save ${FORMAT_LABELS[format]} (${formatFileSize(blob.size)})`;
    button.addEventListener("click", () => {
      void saveDownloadEntry(format);
    });
    downloadListEl.append(button);
  }

  if (downloadListEl.childElementCount === 0) {
    downloadsSection.hidden = true;
  }
};

const renderPreview = (glyphsPreview: GlyphPreview[], hash: string | undefined, formats: Format[]): void => {
  if (!stepResultsEl || !metaEl || !glyphListEl) {
    return;
  }

  metaEl.textContent = `hash: ${hash ?? "—"} · ${glyphsPreview.length} glyph(s) · ${formatListLabel(formats)}`;

  glyphListEl.innerHTML = "";
  glyphListEl.classList.add("preview-font");

  for (const glyph of glyphsPreview) {
    const code = glyph.unicode?.[0];

    if (!code) {
      continue;
    }

    const item = document.createElement("li");
    item.className = "glyph-comparison-item";

    const comparison = document.createElement("div");
    comparison.className = "glyph-comparison";

    const svgCol = document.createElement("div");
    svgCol.className = "comparison-col";
    const svgLabel = document.createElement("span");
    svgLabel.className = "comparison-label";
    svgLabel.textContent = "SVG";
    const svgPreview = document.createElement("div");
    svgPreview.className = "comparison-svg";
    const svgUrl = svgPreviewUrls.get(glyph.srcPath);

    if (svgUrl) {
      const img = document.createElement("img");
      img.src = svgUrl;
      img.alt = glyph.srcPath;
      img.className = "comparison-svg-image";
      svgPreview.append(img);
    }

    svgCol.append(svgLabel, svgPreview);

    const arrow = document.createElement("span");
    arrow.className = "comparison-arrow";
    arrow.textContent = "→";
    arrow.setAttribute("aria-hidden", "true");

    const fontCol = document.createElement("div");
    fontCol.className = "comparison-col";
    const fontLabel = document.createElement("span");
    fontLabel.className = "comparison-label";
    fontLabel.textContent = "Font";
    const fontGlyph = document.createElement("span");
    fontGlyph.className = "glyph-icon";
    fontGlyph.textContent = code;
    fontCol.append(fontLabel, fontGlyph);

    comparison.append(svgCol, arrow, fontCol);

    const name = glyph.name ?? glyph.srcPath.replace(/\.svg$/iu, "");
    const codePoint = code.codePointAt(0);
    const unicodeLabel = codePoint === undefined ? "" : formatUnicodeLabel(codePoint.toString(16));
    const meta = document.createElement("p");
    meta.className = "comparison-meta";
    meta.textContent = unicodeLabel ? `${name} · ${unicodeLabel}` : name;

    item.append(comparison, meta);
    glyphListEl.append(item);
  }
};

for (const input of [formatModeFastInput, formatModeCustomInput]) {
  input?.addEventListener("change", syncFormatPickerVisibility);
}

mappingViewGridInput?.addEventListener("change", () => {
  if (!mappingViewGridInput.checked) {
    return;
  }

  mappingViewMode = "grid";
  renderGlyphMappingPanel();
});

mappingViewListInput?.addEventListener("change", () => {
  if (!mappingViewListInput.checked) {
    return;
  }

  mappingViewMode = "list";
  renderGlyphMappingPanel();
});

mappingIconSizeInput?.addEventListener("input", () => {
  mappingIconSizePx = Number(mappingIconSizeInput.value);
  syncMappingIconSizeLabel();

  if (glyphMappingGridEl) {
    glyphMappingGridEl.style.setProperty("--mapping-icon-size", `${mappingIconSizePx}px`);
  }
});

syncMappingIconSizeLabel();
initWizard();
void restoreSelectionFromSession().then(() => {
  if (!hasSelectedFiles()) {
    renderSelectionPanel();
  }

  syncWizardNavigation();
});
syncSvgPreviewTheme();

for (const input of svgPreviewDarkInputs) {
  input.addEventListener("change", () => {
    svgPreviewDark = input.checked;
    syncSvgPreviewTheme();
  });
}

debugToggle?.addEventListener("change", () => {
  syncDebugPanelVisibility();
});

syncDebugPanelVisibility();
syncFormatPickerVisibility();
setWorkerStatus("idle");
applyWoff2WarmupState(getWoff2WarmupState());
subscribeWoff2Warmup(applyWoff2WarmupState);
startWoff2Warmup();

fileInput?.addEventListener("change", (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const picked = [...(input.files ?? [])];

  input.value = "";

  if (picked.length === 0) {
    return;
  }

  applySelectedFiles(picked);
  hideProgress();
  clearDebugLog();
  clearDownloads();
  setWorkerStatus("idle");
});

clearSelectionButton?.addEventListener("click", () => {
  clearSelection();
});

const preventDragDefaults = (event: DragEvent): void => {
  event.preventDefault();
  event.stopPropagation();
};

dropZoneEl?.addEventListener("dragenter", (event) => {
  preventDragDefaults(event);
  dropZoneEl.classList.add("is-dragover");
});

dropZoneEl?.addEventListener("dragover", (event) => {
  preventDragDefaults(event);
  dropZoneEl.classList.add("is-dragover");
});

dropZoneEl?.addEventListener("dragleave", (event) => {
  preventDragDefaults(event);
  dropZoneEl.classList.remove("is-dragover");
});

dropZoneEl?.addEventListener("drop", (event) => {
  preventDragDefaults(event);
  dropZoneEl.classList.remove("is-dragover");

  const files = event.dataTransfer?.files;

  if (files?.length) {
    applySelectedFiles([...files]);
    hideProgress();
    clearDebugLog();
    clearDownloads();
    setWorkerStatus("idle");
  }
});

convertButton?.addEventListener("click", async () => {
  if (!hasSelectedFiles()) {
    setStatus("Choose one or more SVG files.", true);
    wizard?.goTo("select");
    return;
  }

  const formats = getSelectedFormats();

  if (formats.length === 0) {
    setStatus("Select at least one output format.", true);
    return;
  }

  const mappingError = validateGlyphMappings(glyphMappingRows);

  if (mappingError) {
    setStatus(mappingError, true);
    wizard?.goTo("map");
    return;
  }

  const glyphMappings = glyphMappingsToMetadata(glyphMappingRows);
  const svgIconLayout = getSvgIconLayoutOptions();

  convertButton.disabled = true;
  setStatus("");
  clearDebugLog();
  showProgress();
  appendDebugLog(`Output formats: ${formatListLabel(formats)}`);
  appendDebugLog(`Icon layout: ${formatSvgIconLayoutDebug(svgIconLayout)}`);

  conversionAbortController = new AbortController();
  conversionInProgress = true;

  try {
    const glyphs = await readGlyphsFromFiles();
    assertConversionNotAborted();
    setWorkerStatus("running");

    const result = await convertInWorker({
      glyphs,
      formats,
      verbose: isDebugEnabled(),
      svgTools: getSvgToolsOptions(),
      glyphMappings,
      ...svgIconLayout,
      signal: conversionAbortController.signal,
      onProgress: applyWorkerProgress,
      onDebug: appendDebugLog,
      onLifecycle: (state, elapsedMs) => {
        if (state === "started") {
          setWorkerStatus("running", "Worker: started — conversion off the UI thread");
          appendDebugLog("Worker lifecycle: started");
          return;
        }

        setWorkerStatus("done", `Worker: finished in ${Math.round(elapsedMs ?? 0)} ms`);
        appendDebugLog("Worker lifecycle: finished", elapsedMs);
      },
    });

    setProgress("Preparing preview…", 95, "preview", ["read", "validate", "generate", "encode"]);
    appendDebugLog("Main thread: applying @font-face and preview");
    injectFontFace(result.outputs);
    renderDownloads(result.outputs, result.formats);
    renderPreview(result.glyphsPreview, result.hash, result.formats);
    setProgress("Conversion complete", 100, "preview", ["read", "validate", "generate", "encode", "preview"]);
    hasConversionResults = true;
    clearSelectionSession();
    wizard?.markResultsAvailable();
    wizard?.goTo("results");
    setStatus(`Done — ${glyphs.length} icon(s) converted to ${formatListLabel(result.formats)} via Web Worker.`);
  } catch (error) {
    if (isConversionCancelledError(error)) {
      hideProgress();
      setWorkerStatus("idle");
      appendDebugLog("Conversion cancelled by user");
      setStatus("Conversion cancelled.");
      return;
    }

    const message = error instanceof Error ? error.message : String(error);

    hideProgress();
    setWorkerStatus("error", `Worker: error — ${message}`);
    appendDebugLog(`Error: ${message}`);
    setStatus(message, true);
  } finally {
    conversionInProgress = false;
    conversionAbortController = undefined;
    updateConvertButton(hasSelectedFiles());
  }
});

window.addEventListener("beforeunload", (event) => {
  if (isConversionRunning()) {
    event.preventDefault();
  }

  revokeFontUrl();
  revokeDownloadUrls();
  revokeSvgPreviewUrls();
});
