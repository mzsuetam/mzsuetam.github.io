# Lab Environment & Notebook Workflow Guide

This guide covers cloning your course repository, configuring your Python 3.13 environment using `uv`, managing project requirements, and keeping clean, Git-friendly `.py` versions of your Jupyter notebooks.

---

## 1. Clone and Enter Project

Clone your repository and navigate into the project directory:

```bash
git clone <YOUR_REPO_URL>
cd de2026-yourname
```

---

## 2. Environment Setup with Python 3.13 & `uv`

If you are initializing a project with an existing `requirements.txt`:

1. **Initialize project targeting Python 3.13:**
   ```bash
   uv init --python 3.13 --no-package
   ```
   You can remove the `main.py` created by uv
   ```bash
   rm main.py
   ```

2. **Add dependencies:**
   * If you have an existing `requirements.txt`:
     ```bash
     uv add -r requirements.txt
     ```
   * Add Jupyter and core notebook dependencies:
     ```bash
     uv add jupyter ipykernel jupytext
     ```
     
If you clone the repo in the future, you can just run `uv sync`, and everything will set up on its own.

## 3. Working with Notebooks (`lab1/`, `lab2/`, ...)

Keep your repository organized by placing notebooks in subdirectories:

```text
de2026-yourname/
├── pyproject.toml
├── requirements.txt
├── .python-version
├── uv.lock
├── README.md
├── student-info.json
├── student-info.json.hmac
├── lab1/
|   ├── ...
|   ├── lab1.py
│   └── lab1.ipynb
├── lab2/
|   ├── ...
|   └── lab2.ipynb
...
```

Launch Jupyter from the repository root so all lab folders are accessible:

```bash
uv run jupyter lab
```

*(In VS Code, open the root folder and select the Python interpreter located inside `.venv/`.)*

---

## 4. Gitignoring the input/output files

To gitignore the input/output files, you can use the following gitignore lines, which will first ignore all files inside any lab* directories, and then exclude py scripts,  jupyter notebooks and the reports. 

```.gitignore
# Virtual environment & Python cache
.venv/
__pycache__/
*.py[cod]
.ipynb_checkpoints/

# Ignore everything inside lab folders...
lab*/**/*

# ...except code files and reports
!lab*/*.py
!lab*/*.ipynb
!lab*/*report.json*
```

---

## 5. Exporting & Syncing `.py` from `.ipynb` (Jupytext)

Jupyter notebook files (`.ipynb`) contain bulky JSON outputs and metadata that create noisy Git diffs. Using `jupytext`, you can export clean `.py` scripts formatted with cell markers (`# %%`).

### One-Time Export (`.ipynb` -> `.py`)

To convert an existing notebook to a script:

```bash
uv run jupytext --to py:percent lab1/lab1.ipynb
```
This generates `lab1/lab1.py` with `# %%` cell delimiters.

### Two-Way Syncing (`.py` -> `.ipynb`)

Pair the notebook and the script so changes stay synchronized:

```bash
# Link the notebook and script
uv run jupytext --set-formats ipynb,py:percent lab1/lab1.ipynb

# Sync changes from notebook to script
uv run jupytext --sync lab1/lab1.ipynb

# Sync changes from script back to notebook
uv run jupytext --sync lab1/lab1.py
```

### Why use this workflow?
* **Git-friendly:** Commit only the `.py` file to git; avoid messy JSON merge conflicts.
* **Scriptable:** Run labs directly from the terminal via `uv run python lab1/lab1.py`.
* **Interactive:** Retain the full interactive notebook experience inside JupyterLab or VS Code.


