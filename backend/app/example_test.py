import ctypes
import sys
from app.core.config import settings


def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

if not is_admin():
    # Re-run the script with admin rights
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)
    sys.exit()

# Your privileged code here
with open(settings.IMAGE_STORAGE_PATH + "/dummy.txt", "w") as f:
    f.write("Hello, admin access!")
