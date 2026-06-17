import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  Sex,
  ActivityLevel,
  Goal,
  CarbProfile,
  UserStats,
  DietTargetsSet,
} from '@/utils/tdee';

// ─── Tipos ───────────────────────────────────────────────────

interface WizardDraft {
  sex: Sex | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  bodyFatPct: number | null; // opcional — null = não informado
}

const STEP_MIN = 1;
const STEP_MAX = 4;

const DEFAULT_GOAL: Goal = 'maintenance';
const DEFAULT_CARB_PROFILE: CarbProfile = 'medium_carb';

const EMPTY_DRAFT: WizardDraft = {
  sex: null,
  age: null,
  weightKg: null,
  heightCm: null,
  activityLevel: null,
  bodyFatPct: null,
};

interface TdeeWizardState {
  step: number;
  draft: WizardDraft;
  result: DietTargetsSet | null;
  selectedGoal: Goal;
  selectedCarbProfile: CarbProfile;

  setSex: (sex: Sex) => void;
  setAge: (age: number | null) => void;
  setWeight: (kg: number | null) => void;
  setHeight: (cm: number | null) => void;
  setActivity: (level: ActivityLevel) => void;
  setBodyFat: (pct: number | null) => void;

  goToStep: (n: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setResult: (result: DietTargetsSet) => void;
  setSelection: (goal: Goal, carbProfile: CarbProfile) => void;

  reset: () => void;
  buildUserStats: () => UserStats | null;
}

// ─── Store ───────────────────────────────────────────────────

export const useTdeeWizardStore = create<TdeeWizardState>((set, get) => ({
  step: STEP_MIN,
  draft: { ...EMPTY_DRAFT },
  result: null,
  selectedGoal: DEFAULT_GOAL,
  selectedCarbProfile: DEFAULT_CARB_PROFILE,

  setSex: (sex) => set((s) => ({ draft: { ...s.draft, sex } })),
  setAge: (age) => set((s) => ({ draft: { ...s.draft, age } })),
  setWeight: (kg) => set((s) => ({ draft: { ...s.draft, weightKg: kg } })),
  setHeight: (cm) => set((s) => ({ draft: { ...s.draft, heightCm: cm } })),
  setActivity: (level) => set((s) => ({ draft: { ...s.draft, activityLevel: level } })),
  setBodyFat: (pct) => set((s) => ({ draft: { ...s.draft, bodyFatPct: pct } })),

  goToStep: (n) => set({ step: Math.min(STEP_MAX, Math.max(STEP_MIN, n)) }),
  nextStep: () => set((s) => ({ step: Math.min(STEP_MAX, s.step + 1) })),
  prevStep: () => set((s) => ({ step: Math.max(STEP_MIN, s.step - 1) })),

  setResult: (result) => set({ result }),
  setSelection: (goal, carbProfile) =>
    set({ selectedGoal: goal, selectedCarbProfile: carbProfile }),

  reset: () =>
    set({
      step: STEP_MIN,
      draft: { ...EMPTY_DRAFT },
      result: null,
      selectedGoal: DEFAULT_GOAL,
      selectedCarbProfile: DEFAULT_CARB_PROFILE,
    }),

  buildUserStats: () => {
    const { sex, age, weightKg, heightCm, activityLevel, bodyFatPct } = get().draft;
    if (
      sex === null ||
      age === null ||
      weightKg === null ||
      heightCm === null ||
      activityLevel === null
    ) {
      return null;
    }
    return {
      sex,
      age,
      weightKg,
      heightCm,
      activityLevel,
      // null → undefined (engine recebe undefined = sem BF%)
      ...(bodyFatPct !== null ? { bodyFatPct } : {}),
    };
  },
}));

// ─── Selectors derivados ─────────────────────────────────────

function isStep1Valid(draft: WizardDraft): boolean {
  return (
    draft.sex !== null &&
    draft.age !== null &&
    Number.isInteger(draft.age) &&
    draft.age >= 14 &&
    draft.age <= 100
  );
}

function isStep2Valid(draft: WizardDraft): boolean {
  return (
    draft.weightKg !== null &&
    draft.weightKg >= 30 &&
    draft.weightKg <= 300 &&
    draft.heightCm !== null &&
    draft.heightCm >= 100 &&
    draft.heightCm <= 250
  );
  // bodyFatPct é opcional — não bloqueia avanço
}

function isStep3Valid(draft: WizardDraft): boolean {
  return draft.activityLevel !== null;
}

export function isStepValid(step: number, draft: WizardDraft): boolean {
  switch (step) {
    case 1: return isStep1Valid(draft);
    case 2: return isStep2Valid(draft);
    case 3: return isStep3Valid(draft);
    default: return true;
  }
}

// ─── Hooks de conveniência ───────────────────────────────────

export const useWizardStep = () => useTdeeWizardStore((s) => s.step);
export const useWizardDraft = () => useTdeeWizardStore((s) => s.draft);
export const useWizardResult = () => useTdeeWizardStore((s) => s.result);

export const useWizardSelection = () =>
  useTdeeWizardStore(
    useShallow((s) => ({
      goal: s.selectedGoal,
      carbProfile: s.selectedCarbProfile,
    }))
  );

export const useWizardActions = () =>
  useTdeeWizardStore(
    useShallow((s) => ({
      setSex: s.setSex,
      setAge: s.setAge,
      setWeight: s.setWeight,
      setHeight: s.setHeight,
      setActivity: s.setActivity,
      setBodyFat: s.setBodyFat,
      goToStep: s.goToStep,
      nextStep: s.nextStep,
      prevStep: s.prevStep,
      setResult: s.setResult,
      setSelection: s.setSelection,
      reset: s.reset,
      buildUserStats: s.buildUserStats,
    }))
  );

export const useCanAdvance = () =>
  useTdeeWizardStore((s) => isStepValid(s.step, s.draft));
