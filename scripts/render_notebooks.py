import json, os
import subprocess
import argparse
import sys

from make_tree import walk

JUPYTER_TEMPLATES = ["lab", "classic", "basic"]

def render_notebooks(tree, force=False):
    for key, value in tree.items():
        if isinstance(value, dict):
            render_notebooks(value, force=force)
        elif value.endswith(".ipynb"):
            html_file = value[:-6] + ".html"
            needs_render = (
                not os.path.exists(html_file) or
                os.path.getmtime(html_file) < os.path.getmtime(value)
            )
            if force or needs_render:
                subprocess.run([
                    "jupyter", "nbconvert", "--to", "html", value 
                ])
            else:
                print(f"{value}: skipped")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Render Jupyter notebooks to HTML if they are updated.")
    parser.add_argument("-f", "--force", action="store_true", help="Rerender all notebooks regardless of modification time.")
    parser.add_argument("-c", "--check", action="store_true", help="Check which notebooks need rendering without actually rendering them.")
    args = parser.parse_args()

    ok = True
    if args.check:
        tree = walk("content")
        def check_notebooks(tree):
            for key, value in tree.items():
                if isinstance(value, dict):
                    check_notebooks(value)
                elif value.endswith(".ipynb"):
                    html_file = value[:-6] + ".html"
                    needs_render = (
                        not os.path.exists(html_file) or
                        os.path.getmtime(html_file) < os.path.getmtime(value)
                    )
                    if needs_render:
                        print(f"{value}: needs rendering", file=sys.stderr)
                        global ok
                        ok = False
        check_notebooks(tree)
        if not ok:
            sys.exit(1)
        sys.exit(0)
    else:
        tree = walk("content")
        render_notebooks(tree, force=args.force)
