# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-02

### Added

- **Daemon mode** — long-lived Unix socket server for multi-session workflows
  - `daemon start / stop / status / ping / methods / foreground`
  - JSON-line RPC protocol over `~/.cloak/daemon.sock`
  - Session registry with 1-hour idle TTL and auto-sweep
- **Session management** — create, list, close, save-state
  - Session IDs (`s-*`) and page IDs (`p-*`) for stable references
  - `session save-state` persists cookies + localStorage to JSON
- **Page management** — new, list, close, switch pages within a session
- **Navigation** — `goto`, `back`, `forward`, `reload`, `url`, `title`
- **Content extraction**
  - `content` (full HTML), `text`, `html`, `attr`, `markdown` (Readability + Turndown)
  - `screenshot` (PNG, optional selector/full-page), `pdf`
- **Interaction** — `click`, `dblclick`, `fill`, `type`, `press`, `hover`, `focus`, `blur`, `scroll`, `select`, `check`, `upload`, `drag`, `dispatch`
  - All interaction commands respect `--humanize` session flag
- **Wait & observation** — `wait` (selector/text/url/state/timeout), `sleep`, `snapshot` (a11y tree with `data-cloak-uid`), `frames`, `a11y`
- **JS evaluation** — `eval`, `eval-file` with optional `--arg <json>`
- **Cookies & storage** — `cookies`, `storage`, `local-storage`, `session-storage`
- **Network** — `request` (HTTP via page context)
- **Dialog** — `dialog` with accept/dismiss and optional text
- **One-shot helpers** (no daemon needed)
  - `fetch <url>` — launch, navigate, extract, close
  - `scrape <url>` — CSS selector scraping with `--attr` and `--multi`
- **Launch options** — 30+ flags: `--headless`, `--proxy`, `--geoip`, `--humanize`, `--fingerprint`, `--viewport`, `--timezone`, `--locale`, `--user-agent`, `--storage-state`, `--extensions`, `--extra-headers`, etc.
- **Binary management** — `binary install / info / clear-cache`
- **CDP passthrough** — `serve` (CDP gateway), `connect` (attach to existing CDP WebSocket)
- **Self-test** — `doctor` (dependency check), `test` (fingerprint test), `version`
- **Structured output** — JSON envelope with `ok`/`data`/`error`, `--pretty` (TTY auto), `--quiet` (data-only), `--out` (binary file)
- **Error codes** — 18 stable error codes for programmatic handling
- **Markdown conversion** — `@mozilla/readability` + `turndown` for clean article extraction
