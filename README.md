# 🌿 SASSAFRAS Dashboard

A personal command-center dashboard built on [Glance](https://github.com/glanceapp/glance),
self-hosted on **VISTA** (the household homelab box).

- **URL:** <https://sassafras.vistardg.com> — password-gated by Glance's own auth
- **Runs as:** `vista-sassafras.service`, a rootful Podman Quadlet on VISTA
- **Port:** `127.0.0.1:8094`, **loopback only** — Caddy is the only way in.
  No firewalld port, no LAN-direct access (same posture as mealie).
- **Image:** stock `docker.io/glanceapp/glance:v0.8.5` — no custom build.
  Config and assets are bind-mounted, so a config change is a `git pull` plus a
  service restart, never an image rebuild.

> **Not to be confused with `vista-glance.service`** — the *other* Glance on the
> same box, serving homelab server stats on port 8093 at `glance.vistardg.com`.
> Two separate deployments, two separate configs. Don't merge them.

## Layout

| Path | What |
|---|---|
| `config/glance.yml` | Server, auth, theme, document head |
| `config/home.yml` | The page: columns and widgets |
| `assets/user.css` | Custom styling + handpicked mobile widget order |
| `assets/marginalia.js` + `.json` | Literary Marginalia — 114-quote corpus, picked at random per page load |
| `assets/todoist.js` | Interactive Todoist list (add / complete) |
| `assets/whale.gif` | The companion |
| `quadlet/vista-sassafras.container` | The systemd unit that runs it (rootful) |
| `quadlet/sassafras-tunnel.container` | Cloudflare Tunnel connector (**rootless**, user `toyo7m`) |

## Access paths

Two different paths reach the same container, and they are gated differently.

| From | Path | Gates |
|---|---|---|
| **LAN** | dnsmasq → `192.168.86.49` → Caddy `:443` → `127.0.0.1:8094` | Glance login only |
| **Internet** | Cloudflare edge → tunnel → `127.0.0.1:8094` | Cloudflare Access OTP, **then** Glance login |

The tunnel is never involved on the LAN — dnsmasq is authoritative for
`vistardg.com` inside the house and answers with VISTA's address directly, so
Cloudflare Access does not apply there. Glance's own auth is what protects LAN
access. One prompt inside, two outside; that asymmetry is intentional.

The tunnel routes **`sassafras.vistardg.com` only**. Everything else on the box,
including the homelab stats Glance on 8093, stays LAN-only.

Rootless notes: the connector runs as `toyo7m`, so it is managed with
`systemctl --user` and needs `loginctl enable-linger toyo7m` (already set) to
survive logout and reboot. Its token lives in `~/.config/sassafras-tunnel.env`
(`0600`), not `/etc/vista-rdg/` — a rootless container cannot read a root-only
file.

## Deploying a change

```sh
# on VISTA
cd /srv/vista-rdg/apps/sassafras
sudo git pull
sudo systemctl restart vista-sassafras.service
```

If the unit fails to start, the config didn't parse — `sudo journalctl -u
vista-sassafras.service -n 30` will name the widget. A bad config fails the
service outright rather than serving a broken page.

## Secrets

`/etc/vista-rdg/sassafras.env` (root-only, `0600`), loaded by the unit's
`EnvironmentFile=`. Never in this repo.

| Var | What |
|---|---|
| `AUTH_SECRET_KEY` | `glance secret:make` |
| `AUTH_PASSWORD_HASH` | `glance password:hash '<pw>'` |
| `WORKER_URL` | The `sassafras-proxy` Cloudflare Worker's address |
| `DASHBOARD_KEY` | Shared token the Worker checks as `X-Dashboard-Key`. **Must match** the Worker's own `DASHBOARD_KEY` variable in the Cloudflare dashboard. |

## What still uses the Cloudflare Worker, and why

Most widgets talk to their source directly. Two can't:

- **`/calendar`** — Glance's native `calendar` widget is a month grid with no
  event support, and `custom-api` templates JSON, not ICS. The Worker is an
  ICS→JSON transformer. It was never a Hugging Face workaround.
- **`/todoist`** — holds the Todoist API token, which can't live in browser JS.
  Glance's native `todo` widget is localStorage-only with no sync.

`/youtube`, `/reddit`, `/cubs`, and `/marginalia` are **no longer used** —
native widgets and direct API calls replaced them.

### The `/worker/*` relay

`todoist.js` calls `/worker/*` on this same hostname, not the Worker directly.
Caddy relays it. The Worker hardcodes `Access-Control-Allow-Origin` to the old
Hugging Face Space, so a direct browser fetch from here is blocked by CORS;
going same-origin sidesteps it. Server-side widgets (the calendar) call the
Worker directly and are unaffected.

## Gotchas worth keeping

- **statsapi ignores `divisionId`** — it always returns all three divisions of
  the league. Select on `division.id` in the template; don't index positionally.
- **statsapi hydration order matters** — `hydrate=linescore,probablePitcher`
  returns pitchers; `probablePitcher` alone or reversed silently returns none.
- **Don't mount this app's `assets/` into a throwaway container with `:Z`.**
  That relabels the directory with the throwaway's SELinux MCS categories and
  locks the real container out of its own assets (every asset 403s). Copy the
  files somewhere else for testing instead.
- **Caddy upstreams use an IPv4 literal**, never `localhost` — that resolves
  `::1` first and 502s.
- Two feeds are commented out because they're dead upstream, not misconfigured:
  Bookforum (HTTP 200, zero-byte body) and the Rainfall Projects YouTube
  channel (no uploads playlist).
