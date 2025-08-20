from bs4 import BeautifulSoup
import os
import shutil

HTML_FILE = "index.html"
ICON_FOLDER = "remixicon/icons"
BACKUP_FOLDER = "remixicon/icons_backup"

with open(HTML_FILE, "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

used_icons = set()
for el in soup.find_all(class_=True):
    for cls in el.get("class"):
        if cls.startswith("ri-"):
            used_icons.add(cls)

print(f"Found {len(used_icons)} used icons.")

os.makedirs(BACKUP_FOLDER, exist_ok=True)

# Helper: check if a filename matches a used icon
def matches_icon(filename):
    name, ext = os.path.splitext(filename)
    for icon in used_icons:
        icon_name = icon.replace("ri-", "")
        if icon_name in name:
            return True
    return False

# Recursively scan folders
for root, dirs, files in os.walk(ICON_FOLDER):
    for f in files:
        path = os.path.join(root, f)
        rel_path = os.path.relpath(path, ICON_FOLDER)
        backup_path = os.path.join(BACKUP_FOLDER, rel_path)
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        if matches_icon(f):
            print(f"Kept: {rel_path}")
        else:
            shutil.move(path, backup_path)
            print(f"Moved unused icon: {rel_path}")
