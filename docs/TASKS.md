# tracefixture Tasks

## MVP

- [x] Scaffold StackForge OSS CLI repository.
- [x] Add TypeScript build, package metadata, and CLI bin.
- [x] Implement `record -- <command>` with stdout, stderr, exit code, duration, and command metadata.
- [x] Capture selected written files with content hashes.
- [x] Redact home paths, cwd paths, temp paths, timestamps, env secrets, and custom patterns.
- [x] Implement `replay <fixture>` with stable output comparison and readable diffs.
- [x] Implement `render <fixture> --markdown <file>` for docs snippets.
- [x] Implement `inspect <fixture>` for replay-free fixture summaries.
- [x] Add fixture-backed tests and CLI smoke coverage.
- [x] Write practical README, contribution, and security docs.

## Release Readiness

- [x] Local validation script runs build, check, test, smoke, and package dry run.
- [x] Example fixture is checked in for immediate replay.
- [x] Public GitHub repository is planned for `rogerchappel/tracefixture`.
- [ ] First tagged release.
- [ ] npm publishing decision.

## Later

- [ ] Optional fixture schema JSON file.
- [ ] Directory capture with include/exclude patterns.
- [ ] Snapshot update mode with review-friendly summaries.
- [ ] Richer diff output for JSON and line-oriented logs.
- [ ] Windows shell examples in docs.
