/**
 * todo — server entrypoint (OpenCode 2).
 *
 * Deliberately a no-op: the todo list belongs to the human, and there is no
 * agent tool by design (the agent's own list is `todowrite`). The host still
 * requires a server entrypoint beside `<dir>/tui` for the package to load, so
 * this exists with the same id.
 */

export default {
  id: "todo",
  setup() {},
}
