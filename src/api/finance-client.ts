import { apiClientV2 } from './client-v2'

/**
 * Back-compat shim. The finance v2 client was generalized into `@/api/client-v2`
 * (`apiClientV2`). Existing finance code keeps importing the default export from here.
 *
 * @deprecated Import `apiClientV2` from `@/api/client-v2` for new code.
 */
const financeClient = apiClientV2

export default financeClient
