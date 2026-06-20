# tracefixture

Use this skill when an agent needs to turn a CLI behavior into a reusable, redacted fixture for tests, documentation, release notes, or regression checks.

## When To Use

- A README or docs example should be backed by an executable command trace.
- A CLI smoke test should be replayable without relying on memory or chat logs.
- A failing or passing command should be shared with output redaction and stable normalization.
- A release candidate needs fixture evidence for command behavior.

## Required Inputs

- A local command to record.
- A fixture output path.
- Optional file paths to capture after the command runs.
- Optional custom redaction patterns for repo-specific sensitive values.

## Side Effects

`tracefixture record` runs the requested local command and writes a JSON fixture. It may also capture selected file contents after the command. `tracefixture replay` reruns the recorded command locally. `tracefixture render` writes Markdown when `--markdown` is provided. The tool does not upload traces or call hosted services.

## Approval Boundaries

Ask for approval before recording or replaying commands that publish, deploy, send messages, mutate external accounts, or destroy data. Prefer dry-run, fixture, and local test commands.

## Examples

```bash
tracefixture record --out fixtures/smoke/demo.json --capture output.txt -- npm run smoke
tracefixture inspect fixtures/smoke/demo.json
tracefixture replay fixtures/smoke/demo.json
tracefixture render fixtures/smoke/demo.json --markdown docs/examples/demo.md
```

## Validation Workflow

1. Record the fixture from a deterministic command.
2. Inspect the fixture and review redactions, captured files, exit code, and output size.
3. Replay the fixture from a clean working tree.
4. Render a Markdown snippet when the fixture supports docs or release notes.
5. Run repository checks before sharing: `npm test`, `npm run check`, `npm run smoke`, and `bash scripts/validate.sh`.

## Safety Notes

- Fixture output may include secrets printed by the child command; review fixtures before committing them.
- Custom redaction patterns should be named clearly so reviewers can see what was removed.
- Replays execute the recorded command, so do not replay fixtures from untrusted sources without inspection.
