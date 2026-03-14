from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.db import get_db, close_db

jwt = JWTManager()


def create_app(config_object="config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)

    jwt.init_app(app)
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:3000"]),
        supports_credentials=True,
    )

    app.teardown_appcontext(close_db)

    # ── Blueprints ────────────────────────────────────────────────────────
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from app.routes.birth import birth_bp
    app.register_blueprint(birth_bp, url_prefix="/api/birth")

    from app.routes.janmakundali import janmakundali_bp
    app.register_blueprint(janmakundali_bp, url_prefix="/api/kundali")

    from app.routes.gochar import gochar_bp
    app.register_blueprint(gochar_bp, url_prefix="/api/gochar")

    from app.routes.chatbot import chatbot_bp
    app.register_blueprint(chatbot_bp, url_prefix="/api/chatbot")
    
    from app.routes.horoscope import horoscope_bp
    app.register_blueprint(horoscope_bp, url_prefix="/api/horoscope")

    # ── Health check ──────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app