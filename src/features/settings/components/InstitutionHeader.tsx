import { zodResolver } from '@hookform/resolvers/zod'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  Button,
  ConfirmDeleteDialog,
  errorProps,
  Field,
  Input,
  Menu,
  Modal,
  ModalFooter,
} from '@/components/ui'
import { useApiErrorMessages, useDeleteInstitution, useRenameInstitution } from '@/hooks'
import { apiErrorMessage } from '@/lib/apiError'
import { useToastStore } from '@/store/toastStore'

import { INSTITUTION_NAME_MAX_LENGTH } from '../lib/accountForm'
import type { ProductGroup } from '../lib/products'

const RENAME_FORM_ID = 'institution-rename-form'

/** Group heading of "Mis productos": the institution, with rename and delete. */
export function InstitutionHeader({ group }: { group: ProductGroup }) {
  const { t } = useTranslation('settings')
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteInstitution = useDeleteInstitution()
  const apiErrorMessages = useApiErrorMessages()
  const pushToast = useToastStore(state => state.push)

  if (group.id === null) {
    return (
      <h3 className="pt-4 text-body-sm font-medium text-ink-muted">
        {t('products.noInstitution')}
      </h3>
    )
  }
  const id = group.id
  const hasProducts = group.accountCount > 0 || group.accounts.length > 0

  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <h3 className="text-body-sm font-medium text-ink-muted">{group.name}</h3>
      <Menu
        label={t('products.institutionActions', { name: group.name })}
        icon={MoreHorizontal}
        items={[
          { id: 'rename', label: t('products.rename'), onSelect: () => setRenaming(true) },
          {
            id: 'delete',
            label: hasProducts ? t('products.deleteHasProducts') : t('products.delete'),
            danger: true,
            disabled: hasProducts,
            onSelect: () => setDeleting(true),
          },
        ]}
      />
      {renaming && (
        <RenameInstitutionDialog
          id={id}
          name={group.name ?? ''}
          onDone={() => setRenaming(false)}
        />
      )}
      {deleting && (
        <ConfirmDeleteDialog
          title={t('products.deleteTitle')}
          confirmLabel={t('products.delete')}
          isPending={deleteInstitution.isPending}
          error={apiErrorMessage(deleteInstitution.error, {
            ...apiErrorMessages,
            validation: t('products.deleteHasProducts'),
          })}
          onConfirm={() =>
            deleteInstitution.mutate(id, {
              onSuccess: () => {
                pushToast(t('products.deleted'))
                setDeleting(false)
              },
            })
          }
          onCancel={() => setDeleting(false)}
        >
          <p>{t('products.deleteBody', { name: group.name })}</p>
        </ConfirmDeleteDialog>
      )}
    </div>
  )
}

const renameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'institutionNameRequired' })
    .max(INSTITUTION_NAME_MAX_LENGTH, { error: 'institutionNameTooLong' }),
})

function RenameInstitutionDialog({
  id,
  name,
  onDone,
}: {
  id: string
  name: string
  onDone: () => void
}) {
  const { t } = useTranslation('settings')
  const rename = useRenameInstitution()
  const apiErrorMessages = useApiErrorMessages()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof renameSchema>>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name },
  })
  const fieldError = errors.name?.message
    ? t(`accounts.errors.${errors.name.message as 'institutionNameRequired'}`)
    : null
  const saveError = apiErrorMessage(rename.error, {
    ...apiErrorMessages,
    conflict: t('accounts.institutionExists'),
    unknown: t('accounts.saveError'),
  })

  return (
    <Modal size="sm" title={t('products.renameTitle')} onClose={onDone}>
      <form
        id={RENAME_FORM_ID}
        noValidate
        className="space-y-4"
        onSubmit={event =>
          void handleSubmit(async values => {
            await rename.mutateAsync({ id, name: values.name })
            onDone()
          })(event).catch(() => undefined)
        }
      >
        <Field id="institution-name" label={t('accounts.newInstitutionName')} error={fieldError}>
          <Input
            id="institution-name"
            autoComplete="off"
            invalid={Boolean(fieldError)}
            {...errorProps('institution-name', fieldError)}
            {...register('name')}
          />
        </Field>
        {saveError && (
          <p role="alert" className="text-body-sm text-negative">
            {saveError}
          </p>
        )}
      </form>
      <ModalFooter>
        <Button variant="ghost" className="ml-auto" onClick={onDone} disabled={isSubmitting}>
          {t('accounts.cancel')}
        </Button>
        <Button type="submit" form={RENAME_FORM_ID} loading={isSubmitting}>
          {t('accounts.save')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
