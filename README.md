# Wedding Invitation

Public GitHub Pages site for `https://wedding.hamyeon.com`.

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

