import { Marked } from "https://esm.sh/marked";
import { markedHighlight } from "https://esm.sh/marked-highlight";
import hljs from "https://esm.sh/highlight.js";

const tabs = document.getElementById("folderTabs");
const treeDiv = document.getElementById("fileTree");
const contentDiv = document.getElementById("content");

let treeData = {};



fetch("tree.json?" + Date.now()) // Add cache-busting query param
    .then(res => res.json())
    .then(data => {
        treeData = data;
        initTabs(Object.keys(treeData));
        // Load file from hash if present, after tabs/tree are ready
        if (window.location.hash) {
            const file = decodeURIComponent(window.location.hash.substring(1));
            if (file && file !== "README.md") {
                renderTreeForFile(file);
                loadFile(file);
            }
        }
    });

function toTitleCase(str) {
    return str.replace(/-/g, ' ').replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function initTabs(folders) {
    tabs.innerHTML = "";
    // Add Home tab
    const homeLi = document.createElement("li");
    homeLi.className = "nav-item";
    const homeBtn = document.createElement("button");
    homeBtn.className = "nav-link active";
    homeBtn.textContent = "Home";
    homeBtn.onclick = () => {
        document.querySelectorAll("#folderTabs .nav-link").forEach(n => n.classList.remove("active"));
        homeBtn.classList.add("active");
        treeDiv.innerHTML = "";
        window.location.hash = "";
        loadFile("content/README.md");
    };
    homeLi.appendChild(homeBtn);
    tabs.appendChild(homeLi);

    // Show Home tab by default
    treeDiv.innerHTML = "";
    loadFile("content/README.md");

    folders.forEach((folder, i) => {
        const li = document.createElement("li");
        li.className = "nav-item";

        const button = document.createElement("button");
        button.className = `nav-link`;
        button.textContent = toTitleCase(folder);

        button.onclick = () => {
            document.querySelectorAll("#folderTabs .nav-link").forEach(n => n.classList.remove("active"));
            button.classList.add("active");
            // If folder has README.md, expand tree and open it
            if (treeData[folder] && treeData[folder]["README"]) {
                renderTree(treeData[folder], ["README.md"]);
                window.location.hash = encodeURIComponent("content/" + folder + "/README.md");
                loadFile("content/" + folder + "/README.md");
            } else {
                renderTree(treeData[folder]);
            }
        };

        li.appendChild(button);
        tabs.appendChild(li);
    });
}

const SUPPORTED_FILE_ICONS = [
    "filetype-aac",
    "filetype-ai",
    "filetype-bmp",
    "filetype-cs",
    "filetype-css",
    "filetype-csv",
    "filetype-doc",
    "filetype-docx",
    "filetype-exe",
    "filetype-gif",
    "filetype-heic",
    "filetype-html",
    "filetype-java",
    "filetype-jpg",
    "filetype-js",
    "filetype-json",
    "filetype-jsx",
    "filetype-key",
    "filetype-m4p",
    "filetype-md",
    "filetype-mdx",
    "filetype-mov",
    "filetype-mp3",
    "filetype-mp4",
    "filetype-otf",
    "filetype-pdf",
    "filetype-php",
    "filetype-png",
    "filetype-ppt",
    "filetype-pptx",
    "filetype-psd",
    "filetype-py",
    "filetype-raw",
    "filetype-rb",
    "filetype-sass",
    "filetype-scss",
    "filetype-sh",
    "filetype-sql",
    "filetype-svg",
    "filetype-tiff",
    "filetype-tsx",
    "filetype-ttf",
    "filetype-txt",
    "filetype-wav",
    "filetype-woff",
    "filetype-xls",
    "filetype-xlsx",
    "filetype-xml",
    "filetype-yml",
]

function buildTree(obj, openPathArr = [], parentPath = "content") {
    const ul = document.createElement("ul");
    // Reorder: README last
    const entries = Object.entries(obj);
    const sortedEntries = entries.sort((a, b) => {
        if (a[0].toLowerCase() === 'readme' || a[0].toLowerCase() === 'readme.md') return 1;
        if (b[0].toLowerCase() === 'readme' || b[0].toLowerCase() === 'readme.md') return -1;
        return a[0].localeCompare(b[0]);
    });
    sortedEntries.forEach(([name, value]) => {
        const li = document.createElement("li");
        li.classList.add("tree-row");
        let filePath = null;
        const badgeHtml = " <span \
            class='badge rounded-pill bg-white text-primary border border-primary ms-2' \
            style='transform: translateY(-2px); padding: 2px 5px'> \
                <small style='transform: translateY(-1px); display: block;'>\
                    new \
                </small> \
            </span>";
        // Helper to check if file is new
        function isNewFile(path) {
            const modDateStr = searchTreeForModificationDate(path);
            if (!modDateStr) return false;
            const modDate = new Date(modDateStr);
            const now = new Date();
            const diffDays = (now - modDate) / (1000 * 60 * 60 * 24);
            return diffDays < 7;
        }

        function isReadmeFile(name) {
            return name.toLowerCase() === 'readme' || name.toLowerCase() === 'readme.md';
        }

        if (value && typeof value === "object" && value.path) {
            filePath = value.path;
            let iconClass = "bi bi-filetype-md tree-icon"; // Default icon for no extension

            // Determine icon based on file extension
            const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
            if (extMatch) {
                const ext = extMatch[1].toLowerCase();
                const candidateIcon = `filetype-${ext}`;
                if (SUPPORTED_FILE_ICONS.includes(candidateIcon)) {
                    iconClass = `bi bi-${candidateIcon} tree-icon`;
                }
            }

            li.innerHTML = `<i class='${iconClass}'></i> <span class='tree-label'>${toTitleCase(name)}</span>${isNewFile(filePath) && !isReadmeFile(name) ? badgeHtml : ''}`;
            li.classList.add("file-item");
            li.setAttribute('data-path', filePath);
            li.onclick = (e) => {
                e.stopPropagation();
                window.location.hash = encodeURIComponent(value.path);
                loadFile(value.path, null);
            };
        } else if (value && typeof value === "object" && value.html && value.ipynb) {
            filePath = value.html.path;
            li.innerHTML = `<i class='bi bi bi-filetype-py tree-icon'></i> <span class='tree-label'>${toTitleCase(name)}</span>${isNewFile(filePath) ? badgeHtml : ''}`;
            li.classList.add("file-item");
            li.setAttribute('data-path', filePath);
            li.onclick = (e) => {
                e.stopPropagation();
                window.location.hash = encodeURIComponent(value.html.path);
                loadFile(value.html.path, value.ipynb.path);
            };
        } else {
            // Folder logic
            const folderIcon = document.createElement("i");
            folderIcon.className = "bi bi-folder tree-icon";
            const label = document.createElement("span");
            label.className = "tree-label";
            label.textContent = toTitleCase(name);
            // No badge for folders
            li.appendChild(folderIcon);
            li.appendChild(label);
            // Determine if this folder should be open
            const folderPath = parentPath + '/' + name;
            let isOpen = openPathArr.length > 0 && openPathArr[0] === name;
            const nestedUl = buildTree(value, isOpen ? openPathArr.slice(1) : [], folderPath);
            nestedUl.classList.add("nested");
            if (isOpen) nestedUl.classList.add("active");
            li.appendChild(nestedUl);
            li.onclick = function (e) {
                e.stopPropagation();
                isOpen = !isOpen;
                nestedUl.classList.toggle("active", isOpen);
                folderIcon.className = isOpen ? "bi bi-folder2-open tree-icon" : "bi bi-folder tree-icon";
                // If opening, and README.md exists, open it
                if (isOpen && typeof value === 'object' && value['README']) {
                    window.location.hash = encodeURIComponent(value['README'].path);
                    loadFile(value['README'].path);
                }
            };
            folderIcon.className = isOpen ? "bi bi-folder2-open tree-icon" : "bi bi-folder tree-icon";
        }
        ul.appendChild(li);
    });
    return ul;
}

function renderTree(obj, openPathArr = []) {
    treeDiv.innerHTML = "";
    const ul = buildTree(obj, openPathArr);
    treeDiv.appendChild(ul);
}

function getIpynbForHtml(path) {
    // Try to find the corresponding ipynb for a given html path using treeData
    if (!path.endsWith('.html')) return null;
    // Remove 'content/' and '.html' to get the base
    const rel = path.replace(/^content\//, '').replace(/\.html$/, '');
    const parts = rel.split('/');
    let node = treeData;
    for (let i = 0; i < parts.length - 1; i++) {
        node = node[parts[i]];
        if (!node) return null;
    }
    const base = parts[parts.length - 1];
    if (node && node[base] && node[base].ipynb) {
        return node[base].ipynb;
    }
    return null;
}

function searchTreeForModificationDate(filePath) {
    let node = treeData;
    const parts = filePath.replace(/^content\//, '').split('/');
    for (let i = 0; i < parts.length -1; i++) {
        const part = parts[i];
        if (node[part]) {
            node = node[part];
        } else {
            return null;
        }
    }

    // Remove extension from the last part to match the key in the tree
    const lastPart = parts[parts.length - 1].replace(/\.[^/.]+$/, "");
    const fileObj = node[lastPart];

    return (fileObj ? fileObj["modification-date"] : null) || ( fileObj? fileObj["ipynb"] ? fileObj["ipynb"]["modification-date"] : null : null) || null;
}

function setFileHeader(path, ipynbPath = null) {
    const filePathDiv = document.getElementById('filePath');
    if (filePathDiv) {
        let displayPath = path ? path.replace(/^content\//, '') : '';
        let ipynb = ipynbPath;
        if (!ipynb && path && path.endsWith('.html')) {
            ipynb = getIpynbForHtml(path);
        }

        let modificationDate = searchTreeForModificationDate(ipynb || path);
        modificationDate = modificationDate ? `<small>Last modified: ${modificationDate}</small>` : '';

        if (ipynb) {
            const displayIpynb = ipynb.replace(/^content\//, '');
            const repoUrl = `https://github.com/mzsuetam/mzsuetam.github.io/blob/main/${ipynb}`;
            filePathDiv.innerHTML = `<a href='${repoUrl}' target='_blank' rel='noopener noreferrer'>${displayIpynb}</a> ${modificationDate}`;
        } else if (displayPath) {
            const repoUrl = `https://github.com/mzsuetam/mzsuetam.github.io/blob/main/${path}`;
            filePathDiv.innerHTML = `<a href='${repoUrl}' target='_blank' rel='noopener noreferrer'>${displayPath}</a> ${modificationDate}`;
        } else {
            filePathDiv.textContent = '';
        }


    }
}

function highlightTreeFile(path) {
    // Remove highlight from all file items
    document.querySelectorAll('#fileTree .file-item').forEach(item => {
        item.classList.remove('active-file');
    });
    // Highlight the file item matching the path
    const items = document.querySelectorAll('#fileTree .file-item');
    items.forEach(item => {
        // Store the file path in a data attribute for each file item
        const filePath = item.getAttribute('data-path');
        if (filePath && filePath === path) {
            item.classList.add('active-file');
        }
    });
}


// Call highlightTreeFile after loading a file
function loadFile(path, ipynbPath = null) {

    const marked = new Marked(
    markedHighlight({
        // 1. Set the class prefix highlight.js expects
        langPrefix: 'hljs language-',
        
        // 2. Define the highlight function
        highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
        }
    })
    );

    fetch(path)
        .then(res => res.text())
        .then(content => {
            let html = null;
            if (path.endsWith('.md')) {
                html = `<div class='markdown-scroll markdown-frame'>${marked.parse(content)}</div>`;
            }
            else if (path.endsWith('.html')) {
                html = `
                    <iframe src="${path}" class="notebook-frame"></iframe>
                `;
            } else {
                html = "<p>Unsupported file format.</p>";
            }
            contentDiv.innerHTML = html;
            setFileHeader(path, ipynbPath);
            highlightTabForFile(path);
            highlightTreeFile(path);
        });

    // Highlight the correct tab for the opened file
    function highlightTabForFile(path) {
        const tabs = document.querySelectorAll('#folderTabs .nav-link');
        if (!path || path === 'README.md') {
            tabs.forEach(tab => tab.classList.remove('active'));
            if (tabs[0]) tabs[0].classList.add('active'); // Home tab
            return;
        }
        let found = false;
        tabs.forEach(tab => {
            const folder = tab.textContent.trim().toLowerCase().replace(/ /g, '-');
            if (path.startsWith('content/' + folder + '/')) {
                tab.classList.add('active');
                found = true;
            } else {
                tab.classList.remove('active');
            }
        });
        if (!found && tabs[0]) tabs[0].classList.add('active');
    }
}

// Show header as empty on Home tab
if (typeof setFileHeader === 'function') setFileHeader('');



window.onload = function () {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('main');
    const contentDiv = document.getElementById('content');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const pageHeader = document.getElementsByTagName('header')[0];
    const notebookFrame = document.getElementsByClassName('notebook-frame');
    const markdownFrame = document.getElementsByClassName('markdown-frame');
    let sidebarVisible = true;

    fullscreenBtn.addEventListener('click', function () {
        sidebarVisible = !sidebarVisible;
        sidebar.style.display = sidebarVisible ? '' : 'none';
        fullscreenBtn.innerHTML = sidebarVisible ? '<i class="bi bi-arrows-fullscreen"></i>' : '<i class="bi bi-arrows-angle-contract"></i>';
        if (!sidebarVisible) {
            pageHeader.classList.remove('d-flex');
            pageHeader.classList.add('d-none');
            mainContent.classList.remove('col-md-9');
            mainContent.classList.add('w-100');
            // mainContent.style.height = '100vh';
            if (notebookFrame.length > 0) {
                notebookFrame[0].style.height = '80vh';
            }
            if (markdownFrame.length > 0) {
                markdownFrame[0].style.height = '85vh';
            }
        } else {
            pageHeader.classList.remove('d-none');
            pageHeader.classList.add('d-flex');
            mainContent.classList.add('col-md-9');
            mainContent.classList.remove('w-100');
            // mainContent.style.height = '';
            if (notebookFrame.length > 0) {
                notebookFrame[0].style.height = '65vh';
            }
            if (markdownFrame.length > 0) {
                markdownFrame[0].style.height = '70vh';
            }
        }
    });

    // (Moved hash file loading to after initTabs)
};


// Listen for hash changes (e.g., back/forward navigation)
window.addEventListener('hashchange', function () {
    const file = decodeURIComponent(window.location.hash.substring(1));
    if (file) {
        renderTreeForFile(file);
        loadFile(file);
    }
});

// Helper: render the file tree for the folder containing the file
function renderTreeForFile(filePath) {
    if (!filePath.startsWith('content/')) return;
    const parts = filePath.replace('content/', '').split('/');
    if (parts.length < 2) return;
    const folder = parts[0];
    if (treeData[folder]) {
        renderTree(treeData[folder], parts.slice(1, -1));
    }
}
