# Wedding Invitation

Public GitHub Pages site for `https://wedding.hamyeon.com`.

The paired private editor is `hangcheol/wedding-admin`. The detailed architecture and current operating notes are maintained in `wedding-admin/docs/current-status.md`.

## Current Structure

- `index.html`: invitation layout and Open Graph metadata
- `styles.css`: mobile layout and reveal transitions
- `app.js`: config loading, section visibility, calendar, maps, gallery, BGM, and sharing
- `data/config.json`: invitation content and section flags
- `assets/photos/`: uploaded photos
- `assets/bgm/`: uploaded music

Photos uploaded from the admin are resized to a maximum 1600px edge and saved as WebP. The hero image is preloaded, while below-the-fold photos are loaded shortly before they enter the viewport.

## Design Templates

- `editorial`: photo-led, calm editorial layout
- `paper-story`: hand-drawn paper invitation with a short SVG intro and a different section order

Both templates use the same `data/config.json` content. The published selection is stored in `design.template`; either template can be reviewed without changing the published selection using `?previewTemplate=editorial` or `?previewTemplate=paper-story`.

Content is normally edited from the private admin. `저장 후 공개 배포` commits and pushes this repository, then GitHub Pages rebuilds the site.

## GitHub Pages

1. Create a public repository, for example `hangcheol/wedding-invitation`.
2. Push this folder to the repository.
3. Open `Settings > Pages`.
4. Set the publishing source to the main branch root.
5. Set the custom domain to `wedding.hamyeon.com`.
6. Enable HTTPS after GitHub finishes provisioning the certificate.

## DNS

Create this Cloudflare DNS record:

```text
Type: CNAME
Name: wedding
Target: hangcheol.github.io
Proxy status: DNS only
TTL: Auto
```
