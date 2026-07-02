# tracefixture Agent Skill

Use this skill when an agent needs to record, inspect, replay, or render a deterministic CLI trace fixture without leaking local paths or secrets.

## When To Use

- After adding or changing a CLI smoke command.
- When README examples should be backed by executable command evidence.
- Before a release-candidate PR that needs proof of local command behavior.
- When an agent should compare a current command run against a checked-in fixture.

## Required Inputs

- A local repository checkout.
- A command that can run non-interactively.
- An output fixture path under the repo, usually `fixtures/`.
- Optional capture paths for files the command writes.

## Tools

- Shell access for the command being recorded or replayed.
- Filesystem read/write access for fixture and rendered Markdown files.
- No network access is required by `tracefixture` itself.

## Side-Effect Boundaries

- `record` executes the command supplied after `--`; review that command before running it.
- `inspect` and `render` read an existing fixture and do not re-run the recorded command.
- `replay` executes the fixture command again in the requested working directory.
- Do not record commands that require credentials, publish packages, deploy services, or mutate external accounts.

## Approval Requirements

- Ask before running any recorded or replayed command that writes outside the repo, deletes files, installs packages globally, or contacts external services.
- Ask before replacing a checked-in fixture when the new output changes public docs or release evidence.
- Ask before adding custom redaction patterns that could hide meaningful failure output.

## Workflow

1. Inspect the command and classify its side effects.
2. Record a fixture with stable labels:

   ```bash
   tracefixture record --out fixtures/smoke/demo.json --cwd . --cwd-label '<REPO>' -- npm run smoke
   ```

3. Inspect the fixture without re-running the command:

   ```bash
   tracefixture inspect fixtures/smoke/demo.json
   ```

4. Replay when command side effects are approved:

   ```bash
   tracefixture replay fixtures/smoke/demo.json --cwd .
   ```

5. Render docs evidence:

   ```bash
   tracefixture render fixtures/smoke/demo.json --markdown docs/demo-trace.md
   ```

## Validation

Run these checks after changing trace behavior, docs, or this skill:

```bash
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
bash scripts/validate.sh
```

