// Thin re-export layer so we can place the actual implementation under src/ yet expose a package style plugin.
// Using require to avoid TS rootDir inclusion of the whole ../../src tree for this tiny shim.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const init = require('../../src/plugins/furgonetka').default
export default init
