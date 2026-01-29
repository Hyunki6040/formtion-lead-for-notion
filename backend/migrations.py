"""
Database Migration Script
- 마이그레이션 히스토리 관리
- 기존 데이터 보존
- 중복 실행 방지
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "formtion.db")


def get_connection():
    return sqlite3.connect(DB_PATH)


def init_migrations_table(conn):
    """마이그레이션 히스토리 테이블 생성"""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()


def is_migration_applied(conn, name: str) -> bool:
    """마이그레이션이 이미 적용되었는지 확인"""
    cursor = conn.execute(
        "SELECT 1 FROM _migrations WHERE name = ?", (name,)
    )
    return cursor.fetchone() is not None


def mark_migration_applied(conn, name: str):
    """마이그레이션 적용 완료 기록"""
    conn.execute(
        "INSERT INTO _migrations (name) VALUES (?)", (name,)
    )
    conn.commit()


def column_exists(conn, table: str, column: str) -> bool:
    """테이블에 컬럼이 존재하는지 확인"""
    cursor = conn.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns


# ============================================
# 마이그레이션 정의
# ============================================

MIGRATIONS = [
    {
        "name": "001_add_bookmarks_name_column",
        "description": "북마크에 사용자 지정 이름 컬럼 추가",
        "sql": "ALTER TABLE bookmarks ADD COLUMN name VARCHAR(200)",
        "check": lambda conn: column_exists(conn, "bookmarks", "name"),
    },
    {
        "name": "002_add_og_title_column",
        "description": "프로젝트에 og_title 컬럼 추가",
        "sql": "ALTER TABLE projects ADD COLUMN og_title VARCHAR(200)",
        "check": lambda conn: column_exists(conn, "projects", "og_title"),
    },
    {
        "name": "003_add_og_description_column",
        "description": "프로젝트에 og_description 컬럼 추가",
        "sql": "ALTER TABLE projects ADD COLUMN og_description VARCHAR(500)",
        "check": lambda conn: column_exists(conn, "projects", "og_description"),
    },
    {
        "name": "004_add_og_image_column",
        "description": "프로젝트에 og_image 컬럼 추가",
        "sql": "ALTER TABLE projects ADD COLUMN og_image VARCHAR(1000)",
        "check": lambda conn: column_exists(conn, "projects", "og_image"),
    },
]


def run_migrations():
    """모든 마이그레이션 실행"""
    if not os.path.exists(DB_PATH):
        print(f"[SKIP] Database not found: {DB_PATH}")
        print("[INFO] Database will be created on first app run")
        return

    conn = get_connection()
    init_migrations_table(conn)

    print(f"[DB] {DB_PATH}")
    print(f"[TIME] {datetime.now().isoformat()}")
    print("-" * 50)

    applied_count = 0
    skipped_count = 0

    for migration in MIGRATIONS:
        name = migration["name"]
        description = migration["description"]

        # 이미 적용된 마이그레이션인지 확인
        if is_migration_applied(conn, name):
            print(f"[SKIP] {name} - 이미 적용됨")
            skipped_count += 1
            continue

        # 이미 DB에 반영되어 있는지 확인 (수동으로 적용한 경우)
        if migration.get("check") and migration["check"](conn):
            print(f"[MARK] {name} - 이미 존재함 (히스토리에 기록)")
            mark_migration_applied(conn, name)
            skipped_count += 1
            continue

        # 마이그레이션 실행
        try:
            print(f"[RUN] {name} - {description}")
            conn.execute(migration["sql"])
            conn.commit()
            mark_migration_applied(conn, name)
            print(f"[OK] {name} - 완료")
            applied_count += 1
        except Exception as e:
            print(f"[ERROR] {name} - {e}")
            conn.rollback()
            raise

    conn.close()

    print("-" * 50)
    print(f"[DONE] 적용: {applied_count}, 스킵: {skipped_count}")


if __name__ == "__main__":
    run_migrations()
