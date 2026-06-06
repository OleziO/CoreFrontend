import axios from 'axios'
import { errorInterceptor, requestErrorInterceptor, requestInterceptor, responseInterceptor } from './interceptors'

const financeClient = axios.create({
  baseURL: import.meta.env.VITE_API_PUBLIC_URL_V2
})

financeClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
financeClient.interceptors.response.use(responseInterceptor, errorInterceptor)

export default financeClient
