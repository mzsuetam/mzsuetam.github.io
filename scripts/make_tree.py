import json, os

def walk(dir, basedir=False):
    tree = {}
    # Group files by basename (without extension)
    files = {}
    for item in os.listdir(dir):
        if item.startswith("."):
            continue
        path = os.path.join(dir, item)
        if os.path.isdir(path):
            tree[item] = walk(path)
        elif not basedir:
            base, ext = os.path.splitext(item)
            if base not in files:
                files[base] = {}
            files[base][ext] = path
    # Add grouped files, prefer .html for sidebar, but keep .ipynb for header link
    for base, exts in files.items():
        # If both .html and .ipynb exist, store both, else just one
        if ".html" in exts and ".ipynb" in exts:
            tree[base] = {"html": exts[".html"], "ipynb": exts[".ipynb"]}
        else:
            # Only one file, store as string
            only_ext = list(exts.values())[0]
            tree[base] = only_ext
    return tree


if __name__ == "__main__":
    tree = walk("content", basedir=True)
    with open("tree.json", "w") as f:
        json.dump(tree, f, indent=2)