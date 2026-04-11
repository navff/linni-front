declare global {
  interface Window {
    WebApp?: {
      initData: string;
      initDataUnsafe: {
        user?: {
          id: number;
          first_name?: string;
          last_name?: string;
          username?: string;
        };
        start_param?: string;
      };
      BackButton: {
        show: () => void;
        hide: () => void;
        onClick: (cb: () => void) => void;
        offClick: (cb: () => void) => void;
      };
      HapticFeedback: {
        impactOccurred: (style: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid') => void;
        notificationOccurred: (type: 'success' | 'error' | 'warning') => void;
      };
      enableClosingConfirmation: () => void;
      disableClosingConfirmation: () => void;
      shareMaxContent: (options: { text: string }) => void;
      DeviceStorage: {
        setItem: (key: string, value: string) => Promise<void>;
        getItem: (key: string) => Promise<{ key: string; value: string } | null>;
      };
    };
  }
}

const noop = () => {};
const asyncNoop = async () => {};

const webApp = window.WebApp ?? {
  initData: 'dev',
  initDataUnsafe: {
    user: { id: 1, first_name: 'Тест', username: 'testuser' },
    start_param: undefined,
  },
  BackButton: { show: noop, hide: noop, onClick: noop, offClick: noop },
  HapticFeedback: { impactOccurred: noop, notificationOccurred: noop },
  enableClosingConfirmation: noop,
  disableClosingConfirmation: noop,
  shareMaxContent: noop,
  DeviceStorage: {
    setItem: asyncNoop,
    getItem: async () => null,
  },
};

export function useWebApp() {
  return webApp;
}

export function hapticSuccess() {
  try {
    webApp.HapticFeedback.notificationOccurred('success');
  } catch {}
}

export function hapticError() {
  try {
    webApp.HapticFeedback.notificationOccurred('error');
  } catch {}
}

export function hapticImpact(style: 'light' | 'medium' = 'light') {
  try {
    webApp.HapticFeedback.impactOccurred(style);
  } catch {}
}
