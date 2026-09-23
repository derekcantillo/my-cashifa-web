# my-cashifa-web

Dashboard web de Cashifa (finanzas personales). Consume el backend NestJS en `VITE_API_BASE_URL`,
autenticado con API Key vía header (la key se ingresa en runtime y se guarda en `localStorage`).

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Scripts

| Script               | Descripción                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Servidor de desarrollo           |
| `npm run build`      | Type-check + build de producción |
| `npm run preview`    | Sirve el build localmente        |
| `npm run lint`       | ESLint                           |
| `npm run lint:fix`   | ESLint con autofix               |
| `npm run format`     | Prettier sobre todo el proyecto  |
| `npm run type-check` | Chequeo de tipos (`tsc -b`)      |
