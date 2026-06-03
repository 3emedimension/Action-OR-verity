from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os
import random
import hashlib

app = Flask(__name__)
app.secret_key = os.urandom(24)

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
APP_PASSWORD = "fete2024"   # ← Change ce mot de passe ici
DB_PATH = "game.db"
# ──────────────────────────────────────────────────────────────────────────────

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

HASHED_PASSWORD = hash_password(APP_PASSWORD)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS challenges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                mode TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()

def check_auth():
    return session.get("authenticated") == True

# ─── AUTH ──────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    if check_auth():
        return redirect(url_for("game"))
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    pw = data.get("password", "")
    if hash_password(pw) == HASHED_PASSWORD:
        session["authenticated"] = True
        return jsonify({"success": True})
    return jsonify({"success": False}), 401

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# ─── GAME ──────────────────────────────────────────────────────────────────────

@app.route("/game")
def game():
    if not check_auth():
        return redirect(url_for("index"))
    return render_template("game.html")

@app.route("/api/challenge", methods=["POST"])
def get_challenge():
    if not check_auth():
        return jsonify({"error": "Non autorisé"}), 401
    data = request.get_json()
    ctype = data.get("type")
    mode = data.get("mode")
    valid_modes = ("soft", "hot", "extreme")
    valid_types = ("action", "verite")
    # mode extreme = action uniquement, pas de type
    if mode == "extreme":
        with get_db() as db:
            rows = db.execute(
                "SELECT text FROM challenges WHERE mode='extreme'"
            ).fetchall()
    else:
        if ctype not in valid_types or mode not in valid_modes:
            return jsonify({"error": "Paramètres invalides"}), 400
        with get_db() as db:
            rows = db.execute(
                "SELECT text FROM challenges WHERE type=? AND mode=?", (ctype, mode)
            ).fetchall()
    if not rows:
        return jsonify({"text": None, "empty": True})
    chosen = random.choice(rows)
    return jsonify({"text": chosen["text"], "empty": False})

# ─── ADMIN ─────────────────────────────────────────────────────────────────────

@app.route("/admin")
def admin():
    if not check_auth():
        return redirect(url_for("index"))
    return render_template("admin.html")

@app.route("/api/challenges", methods=["GET"])
def list_challenges():
    if not check_auth():
        return jsonify({"error": "Non autorisé"}), 401
    with get_db() as db:
        rows = db.execute(
            "SELECT id, type, mode, text FROM challenges ORDER BY mode, type, id"
        ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/challenges", methods=["POST"])
def add_challenge():
    if not check_auth():
        return jsonify({"error": "Non autorisé"}), 401
    data = request.get_json()
    ctype = data.get("type", "action")
    mode = data.get("mode")
    text = data.get("text", "").strip()
    if mode not in ("soft", "hot", "extreme") or not text:
        return jsonify({"error": "Données invalides"}), 400
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO challenges (type, mode, text) VALUES (?, ?, ?)", (ctype, mode, text)
        )
        db.commit()
        new_id = cur.lastrowid
    return jsonify({"id": new_id, "type": ctype, "mode": mode, "text": text})

@app.route("/api/challenges/<int:cid>", methods=["PUT"])
def update_challenge(cid):
    if not check_auth():
        return jsonify({"error": "Non autorisé"}), 401
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Texte vide"}), 400
    with get_db() as db:
        db.execute("UPDATE challenges SET text=? WHERE id=?", (text, cid))
        db.commit()
    return jsonify({"success": True})

@app.route("/api/challenges/<int:cid>", methods=["DELETE"])
def delete_challenge(cid):
    if not check_auth():
        return jsonify({"error": "Non autorisé"}), 401
    with get_db() as db:
        db.execute("DELETE FROM challenges WHERE id=?", (cid,))
        db.commit()
    return jsonify({"success": True})

# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("🎲 Action ou Vérité démarré sur http://localhost:5000")
    print(f"🔑 Mot de passe : {APP_PASSWORD}")
    app.run(debug=True, host="0.0.0.0", port=5000)
