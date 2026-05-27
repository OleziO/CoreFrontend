import type { AxiosError, AxiosResponse } from 'axios'

const responseInterceptor = (response: AxiosResponse): Promise<AxiosResponse> => {
  return response.data
}

const errorInterceptor = (error: AxiosError): Promise<AxiosError> => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('userToken')
    window.location.href = '/'
  }

  return Promise.reject(error)
}

export {
  responseInterceptor,
  errorInterceptor
}
