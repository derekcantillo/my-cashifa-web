# CLAUDE.md — my-cashifa-web

**Cashifa**: frontend web de Cachifa para ver las finanzas personales de Derek con más detalle que la app móvil. Desktop-first, preparado para responsive. Meta del MVP: paridad con `MyCachifaMobile` (en pausa). Consume `my-cachifa-backend` (`VITE_API_BASE_URL`; producción `https://api.derekcantillo.com/api/v1`). Repos hermanos dentro de `my-cachifa/`.

## Comandos (usa pnpm, no npm; el README aún dice npm y está desactualizado)
- `pnpm install` · `pnpm dev` · `pnpm build` (`tsc -b && vite build`, escribe `dist/`)
- `pnpm lint` · `pnpm lint:fix` · `pnpm format` · `pnpm type-check` · `pnpm test` (vitest run)
- Antes de cerrar un cambio: `pnpm lint`, `pnpm type-check`, `pnpm test`.

## Stack
React 18, Vite, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), axios, TanStack Query 5, react-router-dom 7, react-hook-form + zod, zustand, i18next (ES/EN), recharts, lucide-react, `clsx` + `tailwind-merge` (`src/lib/cn.ts`), fuentes Instrument Sans + Instrument Serif. Alias `@/*` → `src/*`.

## Estructura (`src/`)
- `api/`: cliente axios (`client.ts`, interceptor con API key y manejo de 401 → `/setup`), un archivo por recurso, `mappers.ts`.
- `hooks/`: un hook de React Query por recurso (`useGoals`, `useTransactions`…), `invalidation.ts`; `lib/queryKeys.ts`.
- `features/`: alerts, auth (`ApiKeySetupScreen`), goals, home, loans, net-worth, reports, settings, transactions, design-showcase (solo desarrollo, ruta `/__design`). Cada una con `components/` y `lib/`.
- `components/ui` (sistema de diseño), `components/layout` (AppShell, Sidebar, Topbar, PeriodSelector…), `components/charts`.
- `store/` (zustand: período seleccionado, modales), `theme/` (`tokens.css`, ThemeProvider), `i18n/locales/{es,en}/` (11 namespaces), `lib/routes.ts` (rutas en español: `/gastos`, `/metas`, `/reportes`, `/prestamos`, `/alertas`, `/patrimonio-neto`, `/ajustes`, `/setup`).

## Reglas
- **El backend es la fuente de los cálculos financieros** (aporte por meta = `goal.plan`, presupuestos, ledger). La web no los recalcula.
- Los datos entran por hooks de React Query; los componentes no llaman a axios directamente. La conversión Decimal → número va en `api/mappers.ts`.
- Todo texto visible pasa por i18n, siempre con las claves en **ES y EN a la vez**. Las alertas y etiquetas de período llegan del backend solo en español (limitación conocida, `lib/alertMessage.ts`).
- La API key se guarda en `localStorage` (`api/apiKeyStore.ts`), nunca en `.env` ni en logs.
- Moneda COP y zona `America/Bogota` (`config/app.ts`).
- Los colores viven en variables CSS (`theme/tokens.css`), nunca hardcodeados en componentes. Los colores de categoría se asignan por posición (rango de gasto del período), no fijos por categoría.

## Diseño
Dirección "Tactile Neo-Minimalism": claridad tipo Apple sin parecer producto de Apple ni "página típica de IA". Principios en `DESIGN_PRINCIPLES.md` (espacio antes que densidad, color con propósito, tono humano, jerarquía tipográfica clara, sin adornos sin función). Los mockups de Stitch son ilustrativos e incluyen features fuera de alcance: seguir el sistema de diseño, no copiar features.

## Convenciones
- Archivos y carpetas en inglés; código y comentarios en inglés; explicaciones a Derek en español.
- Trabajo por bloques con alcance cerrado. Commits pequeños; no hacer `push` sin que Derek lo pida. Decisiones cerradas no se reabren.

## Estado (2026-11-03)
- **Hecho:** rediseño bloques 0–7 (sistema de diseño, Inicio, Gastos, Metas, Reportes, Préstamos, Alertas, Patrimonio neto), i18n ES/EN, temas claro/oscuro/automático. Adaptación al bloque de préstamos del backend: cruzar/descruzar un movimiento con un gasto fijo al editar, corregir monto/fecha/cuenta de un préstamo, deshacer un abono (con `ConfirmDeleteDialog`), validar que un abono no sea anterior al préstamo, el gasto fijo cruzado como opción propia "Cruzado actualmente" al editar, errores de la API traducidos por `statusCode` (`lib/apiError.ts` + `useApiErrorMessages`, usado en movimientos, préstamos y abonos). 124 tests.
- **Patrimonio (paso 1 de `docs/design-liabilities.md` del backend):** `GET /net-worth` trae `info` (metas como apartado, tarjetas sin configurar) y `totals`; las metas y las tarjetas `CREDIT_CARD` ya no suman en el patrimonio.
- **Transferencias (paso 2 del backend, `type: TRANSFER`):** `TRANSACTION_TYPES` incluye `TRANSFER` (`MOVEMENT_TYPES` son los demás); `Transaction` trae `toAccountId`/`toAccount`; `CreateTransactionInput` es unión de movimiento (con categoría) y transferencia (origen y destino, sin categoría). Su dirección es `moved` (`lib/transactionDirection.ts`), así que **nunca cuenta como gasto ni ingreso** en subtotales por día, filtro de dirección, gasto diario, fijo/variable ni ritmo de gasto; los totales de ledger, presupuestos y reportes vienen del backend, que también la excluye. Se muestra neutra, sin signo, "Origen → Destino" (`lib/transfers.ts`, `TransactionRow`), no entra en el filtro por categoría. Formulario propio `TransferForm` (crear y editar; no se puede cambiar el tipo) con atajo "Pagar tarjeta" en Gastos (`openTransfer({ cardPayment: true })` del `transactionModalStore`). Si agregas un cálculo de ingresos/gastos en cliente, usa `getTransactionDirection`, nunca una lista propia de tipos.
- **Depende del backend:** esos cambios (y el nuevo `/net-worth`, que la web lee de `info`/`totals`, y `TRANSFER`, que necesita la migración `20261104025049_add_transfer_transactions`) usan endpoints que están en `main` del backend pero sin desplegar (PATCH con `recurringExpenseId`, PATCH `/loans/:id` con `amount`/`loanDate`/`accountId`, `DELETE /loans/:id/repayments/:repaymentId`, migración `20261103165922_link_loan_repayment_transactions`). Desplegar el backend antes que esta web.
- **Pendiente:** atajo "Pagar tarjeta" fuera de Gastos (Patrimonio, Inicio); rediseño de **Ajustes** y de **Setup de API Key**; pantalla de **editar presupuestos** de un período; `liabilitiesSupport.ts` con `LIABILITIES_IMPLEMENTED = false` hasta que exista Debt/CreditCard; borrar `AmountEntryForm.tsx`, `ConfirmDeletePopover.tsx`, `SectionPlaceholder.tsx` y los alias viejos de `theme/tokens` cuando Ajustes y API Key estén rediseñados; actualizar el README (pnpm).
