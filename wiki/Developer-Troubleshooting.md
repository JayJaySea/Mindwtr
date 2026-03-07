# Developer Troubleshooting

This page collects the most common local development problems and the shortest path to diagnose them.

---

## Dependency / Workspace Issues

### `bun install` fails or packages look out of sync

- Run `bun install` from the repo root, not from an app subdirectory.
- Remove stale lockfile assumptions before debugging code-level failures.
- If versions were just bumped, make sure `bun install` completed after the bump script.

### TypeScript cannot resolve workspace packages

- Check that you are running commands from the repo root unless the package docs say otherwise.
- Re-run `bun install`.
- Confirm the package filter matches the workspace name (`mindwtr`, `mobile`, `@mindwtr/core`, etc.).

---

## Desktop Build Issues

### Tauri build fails on Linux

Common missing prerequisites:

- Rust toolchain
- WebKitGTK development packages
- OpenSSL development packages
- GTK development packages

See [[Developer Guide]] for platform-specific install commands.

### Desktop app starts but diagnostics are missing

Release diagnostics are only available when the app is built with the `diagnostics` feature:

```bash
cd apps/desktop
cargo tauri build --features diagnostics
MINDWTR_DIAGNOSTICS=1 ./src-tauri/target/release/mindwtr
```

### Desktop data or config path confusion

See the storage-path notes in `docs/CONTRIBUTING.md` and the in-app Settings screens.

---

## Mobile Development Issues

### Android/iOS tooling is not detected

- Confirm Android Studio / SDK paths are set
- Confirm Xcode is installed for iOS work
- Start with `bun mobile:start` from the repo root

### Expo / Metro issues

- Restart the Expo dev server
- Re-run `bun install`
- Make sure you are not mixing root and app-level install flows

### Native/device-only bug is not reproducible in tests

- Add the smallest possible unit/integration test for shared logic
- Document the manual device steps in the PR
- Capture logs before changing behavior

---

## Sync / Storage Debugging

### Need more detail from sync failures

Use the built-in diagnostics flow documented in [[Diagnostics and Logs]].

### Suspect a merge or data-integrity bug

Start in this order:

1. `packages/core` tests for the relevant sync/search/store helper
2. platform wrapper tests (desktop/mobile)
3. local diagnostics logs

Do not jump straight to UI changes if the failure mode is actually in the shared core logic.

---

## Testing Problems

### A package test fails but the full app still runs

- Treat the test failure as a real regression until disproven.
- Re-run the narrowest package-level test first.
- Check whether the failure is in the app code or the test harness.

### React Native tests are noisy

- `react-test-renderer` deprecation warnings are expected in current mobile tests.
- Prefer focused assertions over broad snapshot churn.

---

## When To Add More Diagnostics

Add logs or instrumentation when:

- the failure cannot be reproduced consistently
- the bug crosses package boundaries
- sync timing or storage state matters
- a native provider/API behaves differently by platform

Keep logs local and redact secrets/tokens.

---

## Related

- [[Developer Guide]]
- [[Testing Strategy]]
- [[Diagnostics and Logs]]
- [[Architecture]]
