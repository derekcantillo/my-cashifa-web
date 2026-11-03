import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { apiErrorKind, apiErrorMessage, apiErrorStatus, type ApiErrorMessages } from './apiError'

/** An axios error as the backend sends it (HttpExceptionFilter body). */
function httpError(status: number, data: unknown = { success: false, statusCode: status }) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  })
}

const messages: ApiErrorMessages = {
  conflict: 'conflict',
  validation: 'validation',
  notFound: 'notFound',
  unknown: 'unknown',
}

describe('apiErrorStatus', () => {
  it('reads statusCode from the error body', () => {
    expect(apiErrorStatus(httpError(409))).toBe(409)
  })

  it('falls back to the HTTP status when the body has no statusCode', () => {
    expect(apiErrorStatus(httpError(400, 'Bad Request'))).toBe(400)
    expect(apiErrorStatus(httpError(404, { message: 'x' }))).toBe(404)
  })

  it('prefers the body when both are present', () => {
    expect(apiErrorStatus(httpError(500, { statusCode: 409 }))).toBe(409)
  })

  it('is undefined for errors that are not HTTP errors', () => {
    expect(apiErrorStatus(new Error('boom'))).toBeUndefined()
    expect(apiErrorStatus(new AxiosError('Network Error', 'ERR_NETWORK'))).toBeUndefined()
  })
})

describe('apiErrorKind', () => {
  it('maps the status code, never the message', () => {
    expect(apiErrorKind(httpError(409, { statusCode: 409, message: 'anything' }))).toBe('conflict')
    expect(apiErrorKind(httpError(400, { statusCode: 400, message: ['a', 'b'] }))).toBe(
      'validation',
    )
    expect(apiErrorKind(httpError(404))).toBe('notFound')
  })

  it('treats any other failure as unknown', () => {
    expect(apiErrorKind(httpError(500))).toBe('unknown')
    expect(apiErrorKind(new Error('boom'))).toBe('unknown')
  })
})

describe('apiErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(apiErrorMessage(null, messages)).toBeNull()
    expect(apiErrorMessage(undefined, messages)).toBeNull()
  })

  it('picks the message of the error kind', () => {
    expect(apiErrorMessage(httpError(409), messages)).toBe('conflict')
    expect(apiErrorMessage(httpError(400), messages)).toBe('validation')
    expect(apiErrorMessage(httpError(503), messages)).toBe('unknown')
  })
})
