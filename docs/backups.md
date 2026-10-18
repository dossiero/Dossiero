# Backup and restoration

Dossiero's Export backup action creates a ZIP archive with this structure:

```text
backup.json
dossier.sqlite
media/
```

The SQLite database contains dossiers, settings, annotations, links, and references to imported
files. The `media/` directory contains those imported files, thumbnails, and cached favicons. Keep
both together; restoring only the database leaves media references without their files.

## Restore a desktop backup

1. Quit Dossiero completely.
2. Make a separate copy of the current `<userData>/vault/` directory if it contains data you may
   need.
3. Extract the backup ZIP into an empty temporary directory.
4. Confirm that `backup.json`, `dossier.sqlite`, and `media/` are present together.
5. Replace `<userData>/vault/dossier.sqlite` and `<userData>/vault/media/` with the extracted items.
6. Start Dossiero. Database migrations run automatically when an older backup is opened.

Do not merge two media directories. Replace the database and media directory as one matched set.

Passwords saved for social accounts are encrypted with the operating system's secure credential
storage. Their encrypted database values may not be decryptable after restoring onto a different
computer or operating-system account; enter those passwords again after such a restore.
