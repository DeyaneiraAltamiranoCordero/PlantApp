import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastKind, ToastTab } from '../components/ui/ToastTab';
import { useTheme } from '../theme/desingSystem';

export type ToastInput = {
  kind: ToastKind;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const showToast = React.useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const durationMs = input.durationMs ?? 4500;

      const item: ToastItem = {
        id,
        kind: input.kind,
        title: input.title,
        message: input.message,
        durationMs,
      };

      setToasts((prev) => [item, ...prev].slice(0, 3));

      const timer = setTimeout(() => {
        dismissToast(id);
      }, durationMs);

      timersRef.current.set(id, timer);
      return id;
    },
    [dismissToast],
  );

  const ctxValue = React.useMemo<ToastContextValue>(
    () => ({ showToast, dismissToast, clearToasts }),
    [showToast, dismissToast, clearToasts],
  );

  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          pointerEvents="box-none"
          style={[
            styles.stack,
            {
              top: insets.top + theme.spacing.lg,
              right: theme.spacing.lg,
            },
          ]}
        >
          {toasts.map((t) => (
            <ToastTab
              key={t.id}
              kind={t.kind}
              title={t.title}
              message={t.message}
              onClose={() => dismissToast(t.id)}
            />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    stack: {
      position: 'absolute',
      gap: theme.spacing.md,
      alignItems: 'flex-end',
    },
  });
}
