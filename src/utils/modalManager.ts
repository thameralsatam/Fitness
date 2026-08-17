import { useState, useEffect } from 'react';

let activeModalsCount = 0;
const listeners = new Set<(isOpen: boolean) => void>();

export const notifyModalChange = (isOpen: boolean) => {
  if (isOpen) {
    activeModalsCount++;
  } else {
    activeModalsCount = Math.max(0, activeModalsCount - 1);
  }
  const hasOpenModals = activeModalsCount > 0;
  listeners.forEach((fn) => fn(hasOpenModals));
};

export const useIsModalOpen = () => {
  const [isOpen, setIsOpen] = useState(activeModalsCount > 0);

  useEffect(() => {
    const handler = (state: boolean) => setIsOpen(state);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return isOpen;
};
