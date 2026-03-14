from flask import Flask, request, jsonify
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
        origins=["http://localhost:3000"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        supports_credentials=True,
        automatic_options=True,
    )

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            response.headers["Access-Control-Allow-Origin"]      = "http://localhost:3000"
            response.headers["Access-Control-Allow-Headers"]     = "Content-Type, Authorization, Accept"
            response.headers["Access-Control-Allow-Methods"]     = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response, 200

    app.teardown_appcontext(close_db)

    from app.routes.auth         import auth_bp
    from app.routes.birth        import birth_bp
    from app.routes.janmakundali import janmakundali_bp
    from app.routes.gochar       import gochar_bp
    from app.routes.chatbot      import chatbot_bp
    from app.routes.horoscope    import horoscope_bp
    from app.routes.contact      import contact_bp
    from app.routes.settings     import settings_bp

    app.register_blueprint(auth_bp,         url_prefix="/api/auth")
    app.register_blueprint(birth_bp,        url_prefix="/api/birth")
    app.register_blueprint(janmakundali_bp, url_prefix="/api/kundali")
    app.register_blueprint(gochar_bp,       url_prefix="/api/gochar")
    app.register_blueprint(chatbot_bp,      url_prefix="/api/chatbot")
    app.register_blueprint(horoscope_bp,    url_prefix="/api/horoscope")
    app.register_blueprint(contact_bp,      url_prefix="/api/contact")
    app.register_blueprint(settings_bp,     url_prefix="/api/settings")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app