type TApiPaths = import('./schema').paths
type TApiComponents = import('./schema').components

type TPathKeys = keyof TApiPaths

type TPathMethods<Path extends TPathKeys> = keyof TApiPaths[Path]

type TResponseContent<Path extends TPathKeys, Method extends TPathMethods<Path>> =
  TApiPaths[Path][Method] extends { responses: infer R }
    ? R extends { 200: { content: { 'application/json': infer D } } }
      ? D
      : R extends { 201: { content: { 'application/json': infer D } } }
        ? D
        : never
    : never

type TResponse<Path extends TPathKeys, Method extends TPathMethods<Path>> = TResponseContent<Path, Method>

type TRequestParameters<Path extends TPathKeys, Method extends TPathMethods<Path>> =
  TApiPaths[Path][Method] extends { parameters: { path: infer P } } ? P : never

type TRequestQuery<Path extends TPathKeys, Method extends TPathMethods<Path>> =
  TApiPaths[Path][Method] extends { parameters: { query?: infer Q } } ? Q : never

type TRequestBody<Path extends TPathKeys, Method extends TPathMethods<Path>> =
  Required<TApiPaths[Path][Method]> extends { requestBody: { content: { 'application/json': infer B } } } ? B : never
