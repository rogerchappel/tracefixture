# Tracefixture Social Hooks

Drafts grounded in the current CLI: `record`, `replay`, and `render` for local
commands, with redaction and stable cwd labels.

## Short Posts

1. Turn a CLI run into a reusable docs fixture: `tracefixture record`, replay it
   to catch drift, then render the same fixture as Markdown.
2. Tracefixture is useful when a README demo needs proof behind it. Record the
   command once, keep the redacted JSON fixture, and replay it before shipping
   docs.
3. CLI examples rot when outputs change. `tracefixture replay` gives a small
   local check before a fixture-backed docs snippet goes stale.

## Demo Angle

Run the fixture docs demo:

```sh
bash demo/run-fixture-docs.sh
```

Show the generated JSON fixture first, then the Markdown file. Call out that the
demo uses `--cwd-label "<REPO>"` so local absolute paths do not leak into docs.

## Guardrails

- This is an early-stage local CLI.
- Review rendered Markdown before publishing it.
- Redaction patterns should be tested with representative output before sharing
  fixtures publicly.
