'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

// A save is usually instant, and the notice has to stay long enough to be read.
const NOTICE_MILLISECONDS = 1500;

export function useSaveNotice() {
  const [isSaving, setIsSaving] = useState(false);
  const latest = useRef<Promise<unknown>>(undefined);

  // With a request, the notice also waits for it. Without one, the server has already saved.
  const showSaveNotice = useCallback((request?: Promise<unknown>) => {
    const save = Promise.allSettled([
      request,
      new Promise((resolve) => setTimeout(resolve, NOTICE_MILLISECONDS)),
    ]);
    latest.current = save;
    setIsSaving(true);
    // A newer save keeps the notice up until it finishes too.
    save.then(() => {
      if (latest.current === save) {
        setIsSaving(false);
      }
    });
  }, []);

  return { isSaving, showSaveNotice };
}

type Props = {
  isSaving: boolean;
};

// Mounted after the dialogs. A popover joins the same top layer as they do, the last one opened
// on top, which is the only way to show above an open dialog.
export function SaveNotice({ isSaving }: Props) {
  const t = useTranslations('Game');
  const notice = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!isSaving) {
      return;
    }
    if (notice.current?.matches(':popover-open')) {
      notice.current.hidePopover();
    }
    notice.current?.showPopover();
  }, [isSaving]);

  return (
    <p
      ref={notice}
      popover="manual"
      // Hidden from screen readers, which would otherwise announce it on every purchase and door.
      aria-hidden="true"
      className={`pointer-events-none inset-auto right-4 bottom-4 m-0 flex items-center gap-1.5 rounded-full border-0 bg-ui-ink/60 px-2.5 py-1 font-game text-xs text-ui-paper transition-opacity duration-300 not-open:hidden max-sm:bottom-10 ${
        isSaving ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="size-3 animate-spin rounded-full border-2 border-ui-paper/30 border-t-ui-paper motion-reduce:animate-none" />
      {t('autoSaving')}
    </p>
  );
}
