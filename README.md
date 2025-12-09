# [mzsuetam.github.io](https://mzsuetam.github.io)

Page for sharing resources related to my work, including Jupyter notebooks, datasets, and other materials.

## Page Overview

The page displays a small CV header (name, title, contact info) and a file browser for accessing shared content. 

The file browser allows users to navigate through folders and view files (with their GitHub links). Jupyter notebooks are rendered as HTML pages for easy viewing.

Currently, the following types of content are supported:

- Jupyter Notebooks (`.ipynb`): Rendered as HTML pages.
- Markdown files (`.md`): Rendered as HTML pages.
- HTML files (`.html`): Displayed as-is.

## Building and Deploying Content

- Add files and folders to the `content/` directory*.
- Run `just build-content`. This will:
  - generate html files for each ipynb file in the `content/` directory (will skip unchanged notebooks).  
  - generate the `tree.json` file used by the website to display the file browser.
- Commit and push the changes to GitHub.
- The website will be automatically rebuilt and deployed via GitHub Pages.

\* Files and folders starting with `.` will not be visible in the website file browser.