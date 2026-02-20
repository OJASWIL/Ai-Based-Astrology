from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db  = SQLAlchemy()
jwt = JWTManager()


def create_app(config_object="config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:3000"]),
         supports_credentials=True)

    # Blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    # Auto-create tables on first run
    with app.app_context():
        db.create_all()

    return app