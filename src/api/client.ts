import axios from 'axios'
import { errorInterceptor, requestErrorInterceptor, requestInterceptor, responseInterceptor } from './interceptors'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_PUBLIC_URL
})

apiClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor)

export default apiClient
