
build-content:
    just render-notebooks
    just make-tree

make-tree:
    @echo "Creating project directory structure..."
    python scripts/make_tree.py

render-notebooks:
    @echo "Rendering Jupyter notebooks to HTML..."
    python scripts/render_notebooks.py

rerender-notebooks:
    @echo "Re-rendering all Jupyter notebooks to HTML..."
    python scripts/render_notebooks.py --force

check-render-notebooks:
    @echo "Checking if Jupyter notebooks need re-rendering..."
    python scripts/render_notebooks.py --check
