"""
Flask application factory and initialization
"""
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import os
import logging
import sys

# Add parent directory to path so we can import config
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='development'):
    """
    Application factory pattern
    
    Args:
        config_name (str): Configuration name (development, production, testing)
    
    Returns:
        Flask: Configured Flask application
    """
    app = Flask(__name__)
    
    # Import config classes
    from backend.config import DevelopmentConfig, ProductionConfig, TestingConfig
    
    config_dict = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }
    
    # Load configuration
    app.config.from_object(config_dict.get(config_name, DevelopmentConfig))
    
    # Setup logging
    setup_logging(app)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Enable CORS for Next.js frontend
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config.get('FRONTEND_URL', 'http://localhost:3000'),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Register blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    # Error handlers
    register_error_handlers(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app


def setup_logging(app):
    """
    Configure application logging
    """
    log_level = logging.DEBUG if app.debug else logging.INFO
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


def register_error_handlers(app):
    """
    Register custom error handlers
    """
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden'}), 403