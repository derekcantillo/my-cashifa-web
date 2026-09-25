import { ChevronDown, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useFormatters } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Account } from '@/types'

import { InitialBalanceForm } from './InitialBalanceForm'

interface AccountRowProps {
  account: Account
  expanded: boolean
  onToggle: () => void
}

export function AccountRow({ account, expanded, onToggle }: AccountRowProps) {
  const { t } = useTranslation('settings')
  const { money } = useFormatters()
  const panelId = `account-panel-${account.id}`

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-lg px-3 py-4 text-left transition-colors hover:bg-ink/5"
      >
        <Wallet className="size-5 shrink-0 text-ink-muted" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{account.name}</span>
          <span className="block text-sm text-ink-muted">
            {t(`accounts.types.${account.type}`)}
          </span>
        </span>
        <span
          className={cn('font-medium tabular-nums', account.currentBalance < 0 && 'text-danger')}
        >
          {money(account.currentBalance)}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-ink-muted transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {expanded && (
        <div id={panelId}>
          <InitialBalanceForm accountId={account.id} onDone={onToggle} />
        </div>
      )}
    </li>
  )
}
