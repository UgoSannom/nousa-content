# Packs mensuels de l'app Nousa

L'app lit `index.json`, prend le pack le plus récent dont la date `available` est passée, puis télécharge `<id>.<langue>.json`.

Ajouter un pack :

1. Déposer les 6 fichiers `pack-NN.<langue>.json` (fr, en, es, pt-BR, de, it) dans ce dossier.
2. Ajouter une ligne dans `index.json` : `{ "id": "pack-NN", "available": "AAAA-MM-JJ" }`.
3. Fusionner : le site se met à jour et les téléphones récupèrent le pack au lancement suivant, sans mise à jour de l'app.

Format d'un pack : `id`, `lang`, `version`, `title`, `description`, `questions` (`id`, `intensity`, `text`, `hook` facultatif). Les identifiants de questions doivent rester stables (ils servent aux favoris).
