# Cracked Progress Sync

Cracked now supports progress sync through the existing backend.

The app still works offline with `localStorage`. When sync env vars are present, it also pushes and pulls the same progress snapshot through:

- `GET /progress/:syncId`
- `PUT /progress/:syncId`

The backend stores snapshots in SQLite at `PROGRESS_DB_PATH`.

## Local Mac + Browser Test

Start the backend:

```bash
cd backend
APP_SHARED_SECRET=choose-a-secret \
PROGRESS_DB_PATH=./data/cracked-progress.sqlite \
npm start
```

Start the app with sync enabled:

```bash
VITE_PROGRESS_SYNC_URL=http://127.0.0.1:8080 \
VITE_PROGRESS_SYNC_SECRET=choose-a-secret \
npm run dev
```

Open the app and check `Settings > Progress sync`. A new device creates and remembers its own sync ID automatically. To move a device onto existing progress, type the existing sync ID in Settings and load it; that device will keep using the loaded ID on future opens.

## Phone Sync

`127.0.0.1` means "this device", so a phone cannot use your Mac browser's `127.0.0.1` URL.

For a phone on the same Wi-Fi, use your Mac LAN address:

```bash
ipconfig getifaddr en0
```

Then use:

```bash
VITE_PROGRESS_SYNC_URL=http://YOUR_MAC_IP:8080
VITE_PROGRESS_SYNC_SECRET=choose-a-secret
```

For real always-on sync outside your Wi-Fi, deploy the backend somewhere reachable by both devices and keep the same `VITE_PROGRESS_SYNC_*` values in the web/iOS build.

## Hosted Backend Notes

The Dockerfile uses Node 24 because the backend uses Node's built-in SQLite module.

SQLite is fine for a personal single-user backend. If you deploy to infrastructure with ephemeral filesystems, mount persistent storage or replace the storage layer with a hosted database such as Postgres, Turso, or Neon.

## Conflict Model

Sync uses last-write-wins:

1. On startup, the app compares the local progress timestamp with the remote progress timestamp.
2. The newer snapshot wins.
3. After that, app changes are pushed automatically after a short debounce.

Use the sync ID shown in Settings on Mac, browser, and phone to share one progress timeline. `VITE_PROGRESS_SYNC_ID` is only a legacy initial seed; omit it for normal multi-user builds so each fresh device receives a new ID.
