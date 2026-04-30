import { createContext, useCallback, useContext, useReducer, type Dispatch, type ReactNode } from 'react';

const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;

interface AppSettingsState {
  fontSize: number;
}

type AppSettingsAction =
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'RESET' };

const initialState: AppSettingsState = {
  fontSize: DEFAULT_FONT_SIZE,
};

function appSettingsReducer(state: AppSettingsState, action: AppSettingsAction): AppSettingsState {
  switch (action.type) {
    case 'SET_FONT_SIZE':
      return {
        ...state,
        fontSize: Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, action.payload)),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppSettingsContextValue {
  state: AppSettingsState;
  dispatch: Dispatch<AppSettingsAction>;
  /** Scale a base font size relative to the default (14px). */
  fs: (base: number) => number;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appSettingsReducer, initialState);

  const fs = useCallback((base: number) => {
    return Math.round(base * (state.fontSize / DEFAULT_FONT_SIZE) * 100) / 100;
  }, [state.fontSize]);

  return (
    <AppSettingsContext.Provider value={{ state, dispatch, fs }}>
      {children}
    </AppSettingsContext.Provider>
  );
}


export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return ctx;
}

export { DEFAULT_FONT_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE };
