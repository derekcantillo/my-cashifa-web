import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Modal, Textarea } from '@/components/ui'

/** When the clipboard isn't available: the reminder, pre-selected, to copy by hand. */
export function ReminderFallbackDialog({ text, onClose }: { text: string; onClose: () => void }) {
  const { t } = useTranslation('loans')
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fieldRef.current?.select()
  }, [])

  return (
    <Modal
      size="sm"
      title={t('detail.reminderTitle')}
      onClose={onClose}
      footer={
        <Button variant="secondary" className="ml-auto" onClick={onClose}>
          {t('detail.close')}
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-body-sm text-ink-muted">{t('detail.reminderHelp')}</p>
        <Textarea
          ref={fieldRef}
          readOnly
          rows={3}
          value={text}
          aria-label={t('detail.reminderTitle')}
          data-autofocus
          onFocus={event => event.currentTarget.select()}
        />
      </div>
    </Modal>
  )
}
