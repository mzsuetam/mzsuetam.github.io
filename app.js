const tabs = document.getElementById("folderTabs");
const treeDiv = document.getElementById("fileTree");
const contentDiv = document.getElementById("content");

let treeData = {};



fetch("tree.json")
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

function buildTree(obj, openPathArr = []) {
    const ul = document.createElement("ul");
    Object.entries(obj).forEach(([name, value]) => {
        const li = document.createElement("li");
        li.classList.add("tree-row");
        if (typeof value === "string") {
            let iconClass = "bi bi-file-earmark-text tree-icon";
            if (name.endsWith('.ipynb')) {
                iconClass = "bi bi-filetype-py tree-icon";
            } else if (name.endsWith('.md')) {
                iconClass = "bi bi-file-earmark-richtext tree-icon";
            } else if (name.endsWith('.html')) {
                iconClass = "bi bi-file-earmark-binary tree-icon";
            }
            li.innerHTML = `<i class='${iconClass}'></i> <span class='tree-label'>${toTitleCase(name)}</span>`;
            li.classList.add("file-item");
            li.onclick = (e) => {
                e.stopPropagation();
                window.location.hash = encodeURIComponent(value);
                loadFile(value, null);
            };
        } else if (value && typeof value === "object" && value.html && value.ipynb) {
            // Both html and ipynb exist: sidebar loads html, header links to ipynb
            li.innerHTML = `<i class='bi bi bi-filetype-py tree-icon'></i> <span class='tree-label'>${toTitleCase(name)}</span>`;
            li.classList.add("file-item");
            li.onclick = (e) => {
                e.stopPropagation();
                window.location.hash = encodeURIComponent(value.html);
                loadFile(value.html, value.ipynb);
            };
        } else {
            // Folder logic
            const folderIcon = document.createElement("i");
            folderIcon.className = "bi bi-folder tree-icon";
            const label = document.createElement("span");
            label.className = "tree-label";
            label.textContent = toTitleCase(name);
            li.appendChild(folderIcon);
            li.appendChild(label);
            // Determine if this folder should be open
            let isOpen = openPathArr.length > 0 && openPathArr[0] === name;
            const nestedUl = buildTree(value, isOpen ? openPathArr.slice(1) : []);
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
                    window.location.hash = encodeURIComponent(value['README']);
                    loadFile(value['README']);
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

function setFileHeader(path, ipynbPath = null) {
    const filePathDiv = document.getElementById('filePath');
    if (filePathDiv) {
        let displayPath = path ? path.replace(/^content\//, '') : '';
        let ipynb = ipynbPath;
        if (!ipynb && path && path.endsWith('.html')) {
            ipynb = getIpynbForHtml(path);
        }
        if (ipynb) {
            const displayIpynb = ipynb.replace(/^content\//, '');
            const repoUrl = `https://github.com/mzsuetam/mzsuetam.github.io/blob/main/${ipynb}`;
            filePathDiv.innerHTML = `<a href='${repoUrl}' target='_blank' rel='noopener noreferrer'>${displayIpynb}</a>`;
        } else if (displayPath) {
            const repoUrl = `https://github.com/mzsuetam/mzsuetam.github.io/blob/main/${path}`;
            filePathDiv.innerHTML = `<a href='${repoUrl}' target='_blank' rel='noopener noreferrer'>${displayPath}</a>`;
        } else {
            filePathDiv.textContent = '';
        }
    }
}

function loadFile(path, ipynbPath = null) {
    fetch(path)
        .then(res => res.text())
        .then(content => {
            let html = null;
            if (path.endsWith('.md')) {
                html = `<div class='markdown-scroll'>${marked.parse(content)}</div>`;
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
    let sidebarVisible = true;

    fullscreenBtn.addEventListener('click', function () {
        sidebarVisible = !sidebarVisible;
        sidebar.style.display = sidebarVisible ? '' : 'none';
        fullscreenBtn.innerHTML = sidebarVisible ? '<i class="bi bi-arrows-fullscreen"></i>' : '<i class="bi bi-arrows-angle-contract"></i>';
        if (!sidebarVisible) {
            mainContent.classList.remove('col-md-9');
            mainContent.classList.add('w-100');
        } else {
            mainContent.classList.add('col-md-9');
            mainContent.classList.remove('w-100');
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
