const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if there is a Button with DeleteOutlined that is NOT wrapped in Popconfirm
    // We can look for <Button...DeleteOutlined...</Button>
    // but the Regex can be tricky if spread across lines.
    // Assuming mostly single line:
    let regex = /(?<!<Popconfirm[^>]*>\s*)<Button([^>]*DeleteOutlined[^>]*)>(.*?)<\/Button>/g;
    
    let modified = false;
    content = content.replace(regex, (match, p1, p2) => {
        modified = true;
        return `<Popconfirm title="确定删除？" onConfirm={() => {}}><Button${p1}>${p2}</Button></Popconfirm>`;
    });

    // Also handle `<Button icon={<DeleteOutlined />} onClick={...} />` (self-closing)
    let regex2 = /(?<!<Popconfirm[^>]*>\s*)<Button([^>]*DeleteOutlined[^>]*?)\/>/g;
    content = content.replace(regex2, (match, p1) => {
        modified = true;
        return `<Popconfirm title="确定删除？" onConfirm={() => {}}><Button${p1}/></Popconfirm>`;
    });

    if (modified) {
        // ensure Popconfirm is in antd imports
        if (!content.includes('Popconfirm')) {
            content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]antd['"]/, (match, p1) => {
                return `import { ${p1.trim()}, Popconfirm } from 'antd'`;
            });
        }
        
        // fix onConfirm with onClick if exists
        // E.g., <Popconfirm ...><Button ... onClick={(e) => foo()} ...>
        // We want to move onClick to onConfirm.
        let fixOnClickRegex = /<Popconfirm([^>]*)>\s*<Button([^>]*)onClick=\{([^}]+)\}([^>]*)>(.*?)<\/Button>\s*<\/Popconfirm>/g;
        content = content.replace(fixOnClickRegex, (match, popProps, btnBefore, onClickHandler, btnAfter, inner) => {
            // popProps currently has `onConfirm={() => {}}`
            let newPopProps = popProps.replace(/onConfirm=\{[^}]+\}/, `onConfirm={${onClickHandler}}`);
            return `<Popconfirm${newPopProps}><Button${btnBefore}${btnAfter}>${inner}</Button></Popconfirm>`;
        });

        // same for self closing
        let fixOnClickRegex2 = /<Popconfirm([^>]*)>\s*<Button([^>]*)onClick=\{([^}]+)\}([^>]*)\/>\s*<\/Popconfirm>/g;
        content = content.replace(fixOnClickRegex2, (match, popProps, btnBefore, onClickHandler, btnAfter) => {
            let newPopProps = popProps.replace(/onConfirm=\{[^}]+\}/, `onConfirm={${onClickHandler}}`);
            return `<Popconfirm${newPopProps}><Button${btnBefore}${btnAfter}/></Popconfirm>`;
        });

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Modified:', filePath);
    }
}

walkDir('./prototype/src/app', processFile);
