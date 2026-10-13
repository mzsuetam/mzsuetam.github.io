## Setup

First, install Jupytext in your environment:
```bash
uv pip install jupytext
```

## How to use

### 1. Creating/Opening a Notebook
You can open the `.py` file directly in JupyterLab or Jupyter Notebook. Jupytext will treat the `# %%` markers as cell boundaries.

### 2. Syncing `.py` $\leftrightarrow$ `.ipynb`

To create a notebook file from the python script:
```bash
jupytext --set-ipynb lab1.py
```
This creates `lab1.ipynb` and links it to `lab1.py`. Changes in one can be synced to the other:

```bash
# Sync changes from the notebook to the script
jupytext --sync lab1.ipynb
# Sync changes from the script to the notebook
jupytext --sync lab1.py
```

## Why do this?
- **Git-friendly**: You only need to commit the `.py` file. No more messy JSON diffs from `.ipynb` files.
- **Scriptable**: You can run the lab using `python lab1.py` from the terminal.
- **Interactive**: You still get the full power of Jupyter notebooks for exploration.
