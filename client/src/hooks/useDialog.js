import { useEffect, useRef } from 'react';

export default function useDialog(initialFocusRef, fallbackFocusRef) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(document.activeElement);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    initialFocusRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      queueMicrotask(() => {
        const target = returnFocusRef.current?.isConnected
          ? returnFocusRef.current : fallbackFocusRef?.current;
        target?.focus();
      });
    };
  }, [initialFocusRef, fallbackFocusRef]);

  return dialogRef;
}
