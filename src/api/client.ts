import axios from 'axios'
import { parseDynamicKeys } from './helpers'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_PUBLIC_URL // Поменял базовый url для запросов, потому-что мы в схеме получаем /api/v1, и без неё не работает типизация в запросах
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.url) {
      config.url = parseDynamicKeys(config.url, config.dynamicKeys as TIndexedObject | undefined)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  // 1. Функция, которая выполняется для УСПЕШНЫХ ответов (статус 2xx)
  // Мы просто возвращаем ответ без изменений.
  (response) => {
    return response.data
  },
  // 2. Функция, которая выполняется для ОТВЕТОВ С ОШИБКОЙ
  (error) => {
    // Проверяем, что ошибка связана с ответом сервера и статус код - 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Удаляем недействительный токен из хранилища
      localStorage.removeItem('userToken')

      // Перезагружаем страницу. Это самый простой способ "сбросить" состояние
      // приложения и показать пользователю публичную версию сайта (с кнопкой "Войти").
      window.location.href = '/'
    }

    // ВАЖНО: если ошибка была не 401, или даже если была, мы все равно
    // "пробрасываем" ее дальше. Это позволяет компонентам, которые делали
    // запрос (например, TeamsPage), все еще поймать ее в своем блоке catch
    // и показать локальное сообщение об ошибке (например, "Команда не найдена" для 404).
    return Promise.reject(error)
  }
)

export default apiClient
