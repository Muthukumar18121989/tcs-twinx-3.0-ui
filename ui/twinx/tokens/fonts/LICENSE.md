# Bundled fonts

Variable woff2 files, Latin subset, self-hosted so the app makes no request to a font CDN.

| File | Family | Used for |
|---|---|---|
| `ibm-plex-sans-latin-wght-normal.woff2` | IBM Plex Sans | body text (all presets except `modern`) |
| `archivo-latin-wght-normal.woff2` | Archivo | UI headings and numbers; titles in `classic` |
| `cormorant-garamond-latin-wght-normal.woff2`, `...-italic.woff2` | Cormorant Garamond | serif titles in `editorial` (the default) |
| `inter-latin-wght-normal.woff2` | Inter | everything in `modern` |
| `nunito-latin-wght-normal.woff2` | Nunito | the brand wordmark |

All five families are licensed under the SIL Open Font License 1.1 (https://openfontlicense.org). The files come from the
`@fontsource-variable/*` packages. To add or replace a face, drop the woff2 here and add an `@font-face` in `../../fonts.css`.
