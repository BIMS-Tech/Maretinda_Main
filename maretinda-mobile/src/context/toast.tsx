import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { FadeOutDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EASE_OUT } from '@/components/motion';
import { colors } from '@/theme';

type Note = { id: number; text: string; tone: 'success' | 'error'; action?: { label: string; onPress: () => void } };
type Notify = (text: string, options?: { tone?: Note['tone']; action?: Note['action'] }) => void;

const ToastContext = createContext<Notify>(() => {});

/** Short notes at the bottom of the screen: "Barong added to your cart". One at a time. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [note, setNote] = useState<Note | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  const notify = useCallback<Notify>((text, options) => {
    if (timer.current) clearTimeout(timer.current);
    setNote({ action: options?.action, id: ++nextId.current, text, tone: options?.tone ?? 'success' });
    timer.current = setTimeout(() => setNote(null), 4200);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {note && (
        <Animated.View
          accessibilityLiveRegion="polite"
          entering={SlideInDown.duration(420).easing(EASE_OUT)}
          exiting={FadeOutDown.duration(200)}
          key={note.id}
          pointerEvents="box-none"
          style={{ alignItems: 'center', bottom: insets.bottom + 84, left: 0, paddingHorizontal: 16, position: 'absolute', right: 0 }}
        >
          <Animated.View style={{ alignItems: 'center', backgroundColor: '#1E1430', borderRadius: 999, boxShadow: '0 14px 34px rgba(30,20,48,0.35)', flexDirection: 'row', gap: 10, maxWidth: 480, paddingLeft: 12, paddingRight: note.action ? 6 : 18, paddingVertical: 7 }}>
            <Ionicons color={note.tone === 'error' ? '#FF8A8A' : '#7BE0A8'} name={note.tone === 'error' ? 'alert-circle' : 'checkmark-circle'} size={22} />
            <Text numberOfLines={2} style={{ color: colors.white, flexShrink: 1, fontSize: 13.5, fontWeight: '500' }}>
              {note.text}
            </Text>
            {note.action && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  note.action?.onPress();
                  setNote(null);
                }}
                style={{ backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
              >
                <Text style={{ color: '#1E1430', fontSize: 12.5, fontWeight: '700' }}>{note.action.label}</Text>
              </Pressable>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
