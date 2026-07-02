# Release Candidate Notes

## Scope

This release candidate closes the agent-skill packaging gap for `tracefixture` by shipping the documented `SKILL.md` referenced by the README and package manifest.

## Included

- Agent skill instructions for record, inspect, replay, and render workflows.
- Explicit approval boundaries for commands that mutate files or contact external services.
- Existing fixture-backed tests, smoke scripts, package smoke checks, and validation script.

## Verification

Run before requesting review:

```bash
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
bash scripts/validate.sh
```

## Classification

`ship` once the release-candidate PR is green and the tarball includes `SKILL.md`.

