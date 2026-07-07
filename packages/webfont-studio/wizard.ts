export type WizardStepId = "select" | "map" | "convert" | "results";

export const WIZARD_STEPS = [
  { id: "select", label: "Select SVGs" },
  { id: "map", label: "Map glyphs" },
  { id: "convert", label: "Convert" },
  { id: "results", label: "Results" },
] as const satisfies ReadonlyArray<{ id: WizardStepId; label: string }>;

const stepIndex = (step: WizardStepId): number => WIZARD_STEPS.findIndex((entry) => entry.id === step);

export type WizardElements = {
  stepper: HTMLOListElement;
  stagePanels: ReadonlyMap<WizardStepId, HTMLElement>;
  sidebarPanels: ReadonlyMap<WizardStepId, HTMLElement>;
  backButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
};

export type WizardOptions = {
  elements: WizardElements;
  onStepChange?: (step: WizardStepId) => void;
  /** Return false to keep the user on the current step (for example while conversion runs). */
  onBeforeBack?: (fromStep: WizardStepId) => boolean;
};

export type Wizard = {
  getCurrentStep: () => WizardStepId;
  getMaxReachedStep: () => WizardStepId;
  goTo: (step: WizardStepId) => void;
  markResultsAvailable: () => void;
  markStepReachable: (step: WizardStepId) => void;
  resetProgress: () => void;
  syncNavigation: (options: { hasFiles: boolean; mappingValid: boolean; hasResults: boolean }) => void;
};

const setPanelVisible = (panel: HTMLElement, visible: boolean): void => {
  panel.hidden = !visible;
  panel.classList.toggle("is-active", visible);
};

export const createWizard = (options: WizardOptions): Wizard => {
  const { elements, onStepChange, onBeforeBack } = options;
  const { stepper, stagePanels, sidebarPanels, backButton, nextButton } = elements;

  let currentStep: WizardStepId = "select";
  let maxReachedStep: WizardStepId = "select";

  const renderStepper = (): void => {
    const currentIndex = stepIndex(currentStep);
    const maxIndex = stepIndex(maxReachedStep);

    stepper.innerHTML = "";

    for (const [index, entry] of WIZARD_STEPS.entries()) {
      const item = document.createElement("li");
      item.className = "wizard-stepper-item";

      if (index < currentIndex) {
        item.classList.add("is-done");
      }

      if (index === currentIndex) {
        item.classList.add("is-active");
      }

      if (index > maxIndex) {
        item.classList.add("is-upcoming");
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "wizard-stepper-button";
      button.textContent = entry.label;
      button.disabled = index > maxIndex;

      button.addEventListener("click", () => {
        if (index <= maxIndex) {
          goTo(entry.id);
        }
      });

      item.append(button);
      stepper.append(item);
    }
  };

  const goTo = (step: WizardStepId): void => {
    currentStep = step;

    const currentIndex = stepIndex(step);
    const maxIndex = stepIndex(maxReachedStep);

    if (currentIndex > maxIndex) {
      maxReachedStep = step;
    }

    for (const [stepId, panel] of stagePanels) {
      setPanelVisible(panel, stepId === step);
    }

    for (const [stepId, panel] of sidebarPanels) {
      setPanelVisible(panel, stepId === step);
    }

    renderStepper();
    onStepChange?.(step);
  };

  const markResultsAvailable = (): void => {
    maxReachedStep = "results";
    renderStepper();
  };

  const markStepReachable = (step: WizardStepId): void => {
    if (stepIndex(step) > stepIndex(maxReachedStep)) {
      maxReachedStep = step;
      renderStepper();
    }
  };

  const resetProgress = (): void => {
    maxReachedStep = "select";
    goTo("select");
  };

  const syncNavigation = (state: { hasFiles: boolean; mappingValid: boolean; hasResults: boolean }): void => {
    const currentIndex = stepIndex(currentStep);

    backButton.hidden = currentIndex === 0;
    backButton.disabled = currentIndex === 0;

    if (currentStep === "select") {
      nextButton.hidden = false;
      nextButton.textContent = "Continue to mapping";
      nextButton.disabled = !state.hasFiles;
      return;
    }

    if (currentStep === "map") {
      nextButton.hidden = false;
      nextButton.textContent = "Continue to convert";
      nextButton.disabled = !state.mappingValid;
      return;
    }

    if (currentStep === "convert") {
      nextButton.hidden = true;
      return;
    }

    nextButton.hidden = false;
    nextButton.textContent = "Edit mapping";
    nextButton.disabled = !state.hasFiles;
  };

  backButton.addEventListener("click", () => {
    const previous = WIZARD_STEPS[stepIndex(currentStep) - 1];

    if (!previous) {
      return;
    }

    if (onBeforeBack?.(currentStep) === false) {
      return;
    }

    goTo(previous.id);
  });

  nextButton.addEventListener("click", () => {
    if (currentStep === "select") {
      goTo("map");
      return;
    }

    if (currentStep === "map") {
      goTo("convert");
      return;
    }

    if (currentStep === "results") {
      goTo("map");
    }
  });

  goTo("select");

  return {
    getCurrentStep: () => currentStep,
    getMaxReachedStep: () => maxReachedStep,
    goTo,
    markResultsAvailable,
    markStepReachable,
    resetProgress,
    syncNavigation,
  };
};
