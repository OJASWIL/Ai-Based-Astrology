from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.db import init_db


jwt = JWTManager()


def create_app(config_object="config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)

    jwt.init_app(app)
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:3000","http://192.168.1.4:3000",]),
        supports_credentials=True,
    )

    init_db(app)

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from app.routes.birth import birth_bp
    app.register_blueprint(birth_bp, url_prefix="/api/birth")
    
    from app.routes.janmakundali import janmakundali_bp
    app.register_blueprint(janmakundali_bp, url_prefix="/api/kundali")
    
    from app.routes.gochar import gochar_bp
    app.register_blueprint(gochar_bp, url_prefix="/api/gochar")
    

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app