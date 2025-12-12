import json
import os
import subprocess


def get_git_file_date(filepath):
    if not os.path.exists(filepath):
        return None

    try:
        # Find the git repo root
        repo_root = subprocess.check_output([
            'git', 'rev-parse', '--show-toplevel'
        ], cwd=os.path.dirname(os.path.abspath(filepath))).decode('utf-8').strip()

        # Get the path relative to the repo root
        rel_path = os.path.relpath(os.path.abspath(filepath), repo_root)

        result = subprocess.check_output(
            ['git', 'log', '-1', '--format=%cI', '--', rel_path],
            cwd=repo_root
        )
        date = result.decode('utf-8').strip()
        if date:
            return date[:10]  # Only YYYY-MM-DD
    except subprocess.CalledProcessError:
        pass

    # Fallback: use filesystem mtime, only date part
    import datetime
    mtime = os.path.getmtime(filepath)
    dt = datetime.datetime.fromtimestamp(mtime, datetime.timezone.utc)
    return dt.date().isoformat()


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
            tree[base] = {
                "html": {
                    "path": exts[".html"],
                    "modification-date": get_git_file_date(exts[".html"])
                },
                "ipynb": {
                    "path": exts[".ipynb"],
                    "modification-date": get_git_file_date(exts[".ipynb"])
                }
            }
        else:
            # Only one file, store as object
            only_ext = list(exts.keys())[0]
            only_path = exts[only_ext]
            tree[base] = {
                "path": only_path,
                "modification-date": get_git_file_date(only_path)
            }
    return tree


if __name__ == "__main__":
    tree = walk("content", basedir=True)
    with open("tree.json", "w") as f:
        json.dump(tree, f, indent=2)
