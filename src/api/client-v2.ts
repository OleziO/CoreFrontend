import axios, { type AxiosRequestConfig } from 'axios'
import { errorInterceptor, requestErrorInterceptor, requestInterceptor, responseInterceptor } from './interceptors'

/**
 * Shared axios instance for the v2 backend (`VITE_API_PUBLIC_URL_V2`).
 *
 * The v2 backend is not described by the v1 OpenAPI `paths`, so this client is typed with
 * plain string URLs and generic response types instead of the path-typed augmented axios
 * instance used by `@/api/client`. The response interceptor unwraps `response.data`, so each
 * method resolves directly to the body. Request bodies reuse the generated
 * `CreateSlotsDto` / `CreateRequestDto` / `CompleteRequestDto` from `schema-v2.d.ts`.
 */
export interface IApiClientV2 {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_PUBLIC_URL_V2
})

instance.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
instance.interceptors.response.use(responseInterceptor, errorInterceptor)

export const apiClientV2 = instance as unknown as IApiClientV2
