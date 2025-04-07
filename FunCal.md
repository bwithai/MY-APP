# Alembic use 
in full-stack-fastapi-template git:(master)
```bash
alembic revision --autogenerate -m "Create tables for users and command_funds"
alembic upgrade head 

# if add column and somethin then
alembic revision --autogenerate -m "Updated tables for users and command_funds"

```

```bash
# Sync the Environment Use the uv sync command to install all dependencies listed in the pyproject.toml and uv.lock into the .venv:
uv sync
# update the .env
python -c "import secrets; print(secrets.token_urlsafe(32))"
# run
uvicorn app.main:app 
```

## Frontend development

Before you begin, ensure that you have either the Node Version Manager (nvm) or Fast Node Manager (fnm) installed on your system.

* To install fnm follow the [official fnm guide](https://github.com/Schniz/fnm#installation). If you prefer nvm, you can install it using the [official nvm guide](https://github.com/nvm-sh/nvm#installing-and-updating).

* After installing either nvm or fnm, proceed to the `frontend` directory:

* if you use nvm
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# or
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```
* if you use fnm
```bash
curl -fsSL https://fnm.vercel.app/install | bash
```
* then install latest node version
```bash
# If using fnm
fnm install

# If using nvm
nvm install
```

* Within the `frontend` directory, install the necessary NPM packages:

```bash
npm install
```

* And start the live server with the following `npm` script:

```bash
npm run dev
```