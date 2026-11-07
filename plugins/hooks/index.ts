/**
 * hooks — V2 stub.
 *
 * The V1 hook system in this directory relies on string-keyed hooks that V2 no
 * longer invokes. It is kept for the frozen `v1` branch, and this entrypoint
 * exists so the V2 loader can load the directory without error. Port the
 * individual modules to `ctx.<domain>.hook()` before relying on them in V2.
 */

export default {
  id: "hooks",
  setup() {},
}
