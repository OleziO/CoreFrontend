import axios, { type AxiosRequestConfig } from 'axios'
import { errorInterceptor, requestErrorInterceptor, requestInterceptor, responseInterceptor } from './interceptors'

/**
 * The v2 finance backend is not described by the v1 OpenAPI `paths`, so this client is
 * typed with plain string URLs instead of the path-typed augmented axios instance.
 * The response interceptor unwraps `response.data`, so each method resolves to the body.
 */
export interface IFinanceClient {
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

const financeClient = instance as unknown as IFinanceClient

export default financeClient
