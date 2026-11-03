import axios from 'axios'

/** How the UI treats a failed request, decided by status code, never by message. */
export type ApiErrorKind = 'conflict' | 'validation' | 'notFound' | 'unknown'

/**
 * `statusCode` from the backend's error body (HttpExceptionFilter), falling back to the
 * HTTP status. `undefined` for anything that isn't an HTTP error (network, code bugs).
 */
export function apiErrorStatus(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) return undefined
  const body: unknown = error.response?.data
  if (typeof body === 'object' && body !== null && 'statusCode' in body) {
    const { statusCode } = body
    if (typeof statusCode === 'number') return statusCode
  }
  return error.response?.status
}

/**
 * The backend's messages are English-only and meant for developers, so the UI maps the
 * status instead: 409 is a loan movement (managed from Préstamos), 400 a validation
 * error, 404 something deleted meanwhile.
 */
export function apiErrorKind(error: unknown): ApiErrorKind {
  switch (apiErrorStatus(error)) {
    case 409:
      return 'conflict'
    case 400:
      return 'validation'
    case 404:
      return 'notFound'
    default:
      return 'unknown'
  }
}

export type ApiErrorMessages = Record<ApiErrorKind, string>

/** The translated message for `error`, or `null` when there's no error. */
export function apiErrorMessage(error: unknown, messages: ApiErrorMessages): string | null {
  if (error === null || error === undefined) return null
  return messages[apiErrorKind(error)]
}
