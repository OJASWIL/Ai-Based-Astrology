import psycopg2
import psycopg2.extras
from flask import current_app, g


def get_db():
    """Get a database connection for the current request."""
    if "db" not in g:
        cfg = current_app.config
        g.db = psycopg2.connect(
            host=cfg["DB_HOST"],
            port=cfg["DB_PORT"],
            dbname=cfg["DB_NAME"],
            user=cfg["DB_USER"],
            password=cfg["DB_PASSWORD"],
            cursor_factory=psycopg2.extras.RealDictCursor
        )
    return g.db


def close_db(e=None):
    """Close the database connection at end of request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app):
    """Register teardown context only."""
    app.teardown_appcontext(close_db)