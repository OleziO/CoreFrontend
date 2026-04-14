type TIndexedObject<T = any> = {
  [key: string]: T
}

// type TCallbackFn<T extends unknown[] = [], R = void> = (...args: T) => R

// TODO: Set proper type for axios error
type TAppAxiosError = import('axios').AxiosError
