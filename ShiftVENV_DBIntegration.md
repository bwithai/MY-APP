```bash
# Virtual environment managment
pip freeze > requirements.txt
pip download -r requirements.txt -d
python -m venv venv
venv\Scripts\activate
pip install --no-index --find-links=vtul_env -r requirements.txt
```