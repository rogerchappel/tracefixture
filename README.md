# tracefixture

CLI trace fixture recorder and replayer.

## Status

This repository is early-stage. Confirm the current support, release, and
security posture before using it in production.

## Install

```sh
npm install
npm run build
```

## Use

Record a command into a redacted JSON fixture, replay it, and render the fixture
as Markdown for docs:

```sh
node dist/cli.js record --out fixtures/tmp/demo.json --cwd . --cwd-label '<REPO>' -- node scripts/demo-command.mjs
node dist/cli.js inspect fixtures/tmp/demo.json
node dist/cli.js replay fixtures/tmp/demo.json --cwd .
node dist/cli.js render fixtures/tmp/demo.json --markdown fixtures/tmp/demo.md
```

For a disposable end-to-end demo that records a checked-in command, replays it,
and renders Markdown, run:

```sh
bash demo/run-fixture-docs.sh
```

After publishing, use the package binary:

```sh
tracefixture record --out fixtures/smoke/demo.json -- npm test
tracefixture inspect fixtures/smoke/demo.json
tracefixture replay fixtures/smoke/demo.json
tracefixture render fixtures/smoke/demo.json --markdown docs/demo.md
```

## Agent Skill

See [SKILL.md](SKILL.md) for when an agent should record or replay a trace fixture, which side effects require approval, and how to validate fixture evidence.

## Verify

Run the local validation script before opening a pull request:

```sh
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Package contents

The npm package ships the compiled CLI plus README, license, changelog,
contribution guide, and security policy. Check the exact tarball contents with
`npm run package:smoke` before publishing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
