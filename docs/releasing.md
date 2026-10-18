# Public release checklist

Use this checklist before making the repository or a packaged release public.

## Repository

- [x] Choose an open-source license and add the canonical `LICENSE` text.
- [x] Add the repository URL and maintainer/organization metadata to `package.json`.
- [ ] Initialize Git, confirm ignored build and local-data directories are absent from the index,
      and review the complete first commit.
- [ ] Create the GitHub repository and set `main` as the default branch.
- [ ] Enable private vulnerability reporting, Dependabot alerts, and branch protection.
- [ ] Require the CI check for pull requests to `main`.
- [ ] Add repository topics, a short description, and fictional or anonymized screenshots.

## Privacy and security

- [ ] Search the full Git history for credentials, tokens, personal data, databases, and media.
- [ ] Confirm `.dev-data/`, build output, release artifacts, `.env` files, and editor state are ignored.
- [x] Run `npm audit --omit=dev` against the public npm registry and review development-tool
      advisories separately.
- [x] Test imports with hostile filenames and confirm all cross-process inputs remain validated.
- [ ] Replace any real local test data with fictional fixtures before recording screenshots.

## Desktop distribution

- [ ] Configure macOS Developer ID signing and notarization.
- [ ] Configure Windows signing before presenting an installer as a trusted release.
- [ ] Build and smoke-test each supported operating system and architecture.
- [x] Test complete backup export and restoration with the automated persistence suite.
- [ ] Test installation, replacement, upgrade, and uninstall behavior on each supported platform.
- [ ] Publish checksums and release notes with known limitations and data compatibility notes.

## Release quality

- [ ] Run `npm ci` in a clean checkout.
- [x] Run `npm run check`.
- [ ] Create an unpacked desktop build and smoke-test browser and Electron modes.
- [ ] Run the Package smoke tests workflow successfully for macOS, Windows, and Linux.
- [ ] Verify the README setup path on a machine without existing project dependencies.
- [ ] Tag the release only after CI and platform artifacts succeed.
