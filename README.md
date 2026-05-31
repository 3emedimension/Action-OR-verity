# 🎲 Action ou Vérité

Jeu de soirée complet avec interface web moderne, backend Flask et base de données SQLite.

## Démarrage rapide

```bash
pip install -r requirements.txt
python app.py
```

Puis ouvre http://localhost:5000 dans ton navigateur.

## Configuration

Dans `app.py`, ligne 11 :

```python
APP_PASSWORD = "fete2024"   # ← Changer ici
```

## Fonctionnalités

- 🔐 Connexion protégée par mot de passe
- 👥 Joueurs illimités
- 🎯 Action ou Vérité
- 🌸 Mode Soft / 🔥 Mode Hot
- ⚙️ Panel admin pour gérer les défis
- 💾 Stockage SQLite local (aucune dépendance externe)
- 📱 Responsive mobile + desktop

## Structure

```
action-verite/
├── app.py               # Backend Flask
├── requirements.txt
├── game.db              # Créé automatiquement au premier lancement
├── templates/
│   ├── login.html
│   ├── game.html
│   └── admin.html
└── static/
    ├── css/main.css
    └── js/
        ├── game.js
        └── admin.js
```

## Hébergement

Pour héberger en production, utilise **gunicorn** :

```bash
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

Ou sur **Railway**, **Render**, **Fly.io** — fournis simplement le `requirements.txt` et définis la commande de démarrage comme ci-dessus.
