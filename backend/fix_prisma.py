import os
import shutil

base_dir = r"C:\Users\theomartins-ieg\OneDrive - Instituto Germinare"
dest_dir = r"C:\Users\theomartins-ieg\OneDrive - Instituto Germinare\Área de Trabalho\Ciência de Dados\Projeto Swift\neuroanalytics-swift\backend\.venv\Lib\site-packages\prisma"

for root, dirs, files in os.walk(base_dir):
    if "client.py" in files and "site-packages" in root and "prisma" in root:
        if "rea de Trabalho" in root and "Área de Trabalho" not in root:
            print(f"Found generated client at: {root}")
            print(f"Copying to {dest_dir}...")
            shutil.copytree(root, dest_dir, dirs_exist_ok=True)
            print("Done!")
            break
