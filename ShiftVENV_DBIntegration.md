```bash
# Virtual environment managment
pip freeze > requirements.txt
pip download -r requirements.txt -d
python -m venv venv
venv\Scripts\activate
pip install --no-index --find-links=vtul_env -r requirements.txt
```


## Alembic Migration
```bash
# 
cd app/alembic/versions; Remove-Item *.py
# Now let's go back to the backend directory and create a new initial migration:
cd ../../../; alembic revision --autogenerate -m "initial"
# Now let's run the migration to create all the tables:
alembic upgrade head

# if face user privileges then try
docker compose exec db mysql -u root -pmysqlroot -e "CREATE DATABASE IF NOT EXISTS cfms; GRANT ALL PRIVILEGES ON cfms.* TO 'newuser'@'%'; FLUSH PRIVILEGES;"
```

#### Understanding Alembic Database Migrations

##### 1. What is Alembic?
- A database migration tool for managing schema changes in SQLAlchemy/SQLModel
- Tracks database versions in the `alembic_version` table
- Migrations are Python files with `upgrade()` and `downgrade()` functions
  - `upgrade()`: Applies schema changes going forward
  - `downgrade()`: Rolls back changes to previous version

##### 2. Steps We Performed
1. Cleaned up existing migrations
   - Removed all old migration files for fresh start
2. Generated new initial migration
   - Used `alembic revision --autogenerate -m "initial"`
   - `--autogenerate` flag scans SQLModel classes to create migration
3. Applied the migration
   - Ran `alembic upgrade head` to create database tables

##### 3. Essential Alembic Commands
| Command | Description |
|---------|-------------|
| `alembic revision --autogenerate -m "description"` | Create new migration |
| `alembic upgrade head` | Apply all pending migrations |
| `alembic downgrade -1` | Rollback last migration |
| `alembic current` | Show current DB version |
| `alembic history` | Display migration history |