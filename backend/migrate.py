from app.main import migrate_existing_db

if __name__ == "__main__":
    migrate_existing_db()
    print("Database migration completed.")
