#!/usr/bin/env python
"""
migrate.py
----------------------------------------------
Usage:
  python migrate.py migrate          # run all pending migrations
  python migrate.py rollback         # roll back the last batch
  python migrate.py status           # show which migrations have run
  python migrate.py make <name>      # create a new blank migration file
"""

import os
import sys
import importlib.util
from datetime import datetime
from app import create_app
from app.db import get_db

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")
app = create_app()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_migrations_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id         SERIAL PRIMARY KEY,
            migration  VARCHAR(255) NOT NULL UNIQUE,
            batch      INTEGER      NOT NULL,
            ran_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        );
    """)


def _get_ran(cur) -> list[str]:
    cur.execute("SELECT migration FROM _migrations ORDER BY id;")
    return [r["migration"] for r in cur.fetchall()]


def _get_last_batch(cur) -> int:
    cur.execute("SELECT COALESCE(MAX(batch), 0) AS b FROM _migrations;")
    return cur.fetchone()["b"]


def _load_module(filepath: str):
    spec   = importlib.util.spec_from_file_location("migration", filepath)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _all_files() -> list[str]:
    """Return migration filenames sorted (001_... before 002_...)."""
    if not os.path.isdir(MIGRATIONS_DIR):
        os.makedirs(MIGRATIONS_DIR)
    files = [
        f for f in os.listdir(MIGRATIONS_DIR)
        if f.endswith(".py") and not f.startswith("_")
    ]
    return sorted(files)


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_migrate():
    with app.app_context():
        conn = get_db()
        cur  = conn.cursor()
        _ensure_migrations_table(cur)
        conn.commit()

        ran   = _get_ran(cur)
        batch = _get_last_batch(cur) + 1
        files = _all_files()

        pending = [f for f in files if f not in ran]
        if not pending:
            print("✅ Nothing to migrate — everything is up to date.")
            cur.close()
            return

        for filename in pending:
            filepath = os.path.join(MIGRATIONS_DIR, filename)
            print(f"  ⏳ Running migration: {filename}")
            module = _load_module(filepath)
            module.up(conn)
            cur.execute(
                "INSERT INTO _migrations (migration, batch) VALUES (%s, %s);",
                (filename, batch)
            )
            conn.commit()
            print(f"  ✅ Migrated: {filename}")

        cur.close()
        print(f"\n🎉 Batch {batch} complete — {len(pending)} migration(s) ran.")


def cmd_rollback():
    with app.app_context():
        conn = get_db()
        cur  = conn.cursor()
        _ensure_migrations_table(cur)

        batch = _get_last_batch(cur)
        if batch == 0:
            print("✅ Nothing to roll back.")
            cur.close()
            return

        cur.execute(
            "SELECT migration FROM _migrations WHERE batch = %s ORDER BY id DESC;",
            (batch,)
        )
        to_rollback = [r["migration"] for r in cur.fetchall()]

        for filename in to_rollback:
            filepath = os.path.join(MIGRATIONS_DIR, filename)
            print(f"  ⏳ Rolling back: {filename}")
            module = _load_module(filepath)
            module.down(conn)
            cur.execute(
                "DELETE FROM _migrations WHERE migration = %s;", (filename,)
            )
            conn.commit()
            print(f"  ✅ Rolled back: {filename}")

        cur.close()
        print(f"\n🎉 Batch {batch} rolled back — {len(to_rollback)} migration(s).")


def cmd_status():
    with app.app_context():
        conn = get_db()
        cur  = conn.cursor()
        _ensure_migrations_table(cur)

        ran   = set(_get_ran(cur))
        files = _all_files()

        print(f"\n{'Migration':<50} {'Status':<12} Batch")
        print("-" * 70)

        for filename in files:
            if filename in ran:
                cur.execute(
                    "SELECT batch FROM _migrations WHERE migration = %s;",
                    (filename,)
                )
                batch  = cur.fetchone()["batch"]
                status = "✅ Ran"
            else:
                batch  = "-"
                status = "⏳ Pending"
            print(f"{filename:<50} {status:<12} {batch}")

        cur.close()
        print()


def cmd_make(name: str):
    if not name:
        print("❌  Usage: python migrate.py make <migration_name>")
        sys.exit(1)

    os.makedirs(MIGRATIONS_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename  = f"{timestamp}_{name}.py"
    filepath  = os.path.join(MIGRATIONS_DIR, filename)

    template = f'''"""
Migration : {name}
Created   : {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
"""


def up(conn):
    """Apply the migration."""
    cur = conn.cursor()

    cur.execute("""
        -- TODO: write your CREATE TABLE / ALTER TABLE here
    """)

    conn.commit()
    cur.close()


def down(conn):
    """Reverse the migration."""
    cur = conn.cursor()

    cur.execute("""
        -- TODO: write your DROP TABLE / ALTER TABLE here
    """)

    conn.commit()
    cur.close()
'''

    with open(filepath, "w") as f:
        f.write(template)

    print(f"✅ Migration created: migrations/{filename}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

COMMANDS = {
    "migrate":  cmd_migrate,
    "rollback": cmd_rollback,
    "status":   cmd_status,
}

if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print(__doc__)
        sys.exit(0)

    command = args[0]

    if command == "make":
        name = "_".join(args[1:]) if len(args) > 1 else ""
        cmd_make(name)
    elif command in COMMANDS:
        COMMANDS[command]()
    else:
        print(f"❌  Unknown command: '{command}'")
        print("    Available: migrate | rollback | status | make <name>")
        sys.exit(1)