import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "kokpit.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT 'New Chat',
                model TEXT NOT NULL DEFAULT 'llama3.2',
                system_prompt TEXT NOT NULL DEFAULT 'You are a helpful assistant.',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        """)
        await db.commit()


async def get_sessions():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM sessions ORDER BY updated_at DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def get_session(session_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def create_session(title: str, model: str, system_prompt: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO sessions (title, model, system_prompt) VALUES (?, ?, ?)",
            (title, model, system_prompt)
        )
        await db.commit()
        return await get_session(cursor.lastrowid)


async def update_session(session_id: int, **kwargs):
    fields = {k: v for k, v in kwargs.items() if v is not None}
    if not fields:
        return await get_session(session_id)
    fields['updated_at'] = 'CURRENT_TIMESTAMP'
    set_clause = ", ".join(
        f"{k} = CURRENT_TIMESTAMP" if k == 'updated_at' else f"{k} = ?"
        for k in fields
    )
    values = [v for k, v in fields.items() if k != 'updated_at']
    values.append(session_id)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"UPDATE sessions SET {set_clause} WHERE id = ?", values
        )
        await db.commit()
    return await get_session(session_id)


async def delete_session(session_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await db.commit()


async def get_messages(session_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def save_message(session_id: int, role: str, content: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, role, content)
        )
        await db.commit()
        # bump session updated_at
        await db.execute(
            "UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (session_id,)
        )
        await db.commit()
        return cursor.lastrowid


async def clear_messages(session_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "DELETE FROM messages WHERE session_id = ?", (session_id,)
        )
        await db.commit()
