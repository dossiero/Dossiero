# Security policy

## Supported versions

Dossiero is currently pre-1.0. Security fixes are applied to the latest source revision; older
releases are not supported unless a release note says otherwise.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability or include private dossier data in
any report. Use GitHub's private vulnerability reporting feature when it is enabled for the
repository. If it is not available, open an issue without sensitive technical details and ask the
maintainer to enable a private GitHub reporting path.

Use GitHub Issues for non-sensitive bugs and security-hardening suggestions.

Include a concise description, affected version or commit, reproduction steps, impact, and any
suggested mitigation. Remove personal data, credentials, and unrelated machine details.

You can expect an acknowledgement when the report is received. A fix timeline depends on severity
and reproducibility; coordinated disclosure is preferred.

## Security boundaries

Dossiero is local-first, but local does not mean risk-free. Changes involving the preload bridge,
IPC channels, the loopback development server, URL handling, media paths, SQLite migrations, or
credential storage require explicit security review and relevant tests.
