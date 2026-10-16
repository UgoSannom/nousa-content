# nousa-content

Site vitrine et contenu public de l'app Nousa, servi par Cloudflare Workers (fichiers statiques) sur https://nousa.hugodelseaux.fr.

| Dossier | Contenu |
|---|---|
| `index.html` | Redirige vers la langue du navigateur (ou celle choisie avant) |
| `<lang>/` | Accueil du site, en 6 langues (en, fr, es, pt-BR, de, it) |
| `legal/<lang>/` | Aide (`support.html`), confidentialité, conditions et mentions légales (`notice.html`) |
| `assets/` | Styles, polices auto-hébergées (licence OFL), images |
| `packs/` | Packs de questions mensuels (JSON), téléchargés par l'app |

Toutes les pages HTML sont générées depuis le dossier du projet (`site/build.py`, textes dans `site/i18n/` et `legal/src/`). Ne pas les modifier à la main.
