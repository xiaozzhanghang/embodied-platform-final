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
    
    let modified = false;

    const regex1 = /<Popconfirm[^>]*title="([^"]+)"[^>]*onConfirm=\{([^}]+)\}[^>]*>\s*<Button([^>]*)>([^<]*)<\/Button>\s*<\/Popconfirm>/g;
    content = content.replace(regex1, (match, title, onConfirmStr, btnProps, btnText) => {
        modified = true;
        let cleanBtnProps = btnProps.replace(/\s*onClick=\{[^}]+\}/g, '');
        return `<Button${cleanBtnProps} onClick={() => Modal.confirm({ title: '${title}', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: ${onConfirmStr} })}>${btnText}</Button>`;
    });

    const regex2 = /<Popconfirm[^>]*title="([^"]+)"[^>]*onConfirm=\{([^}]+)\}[^>]*>\s*<Button([^>]*?)\/>\s*<\/Popconfirm>/g;
    content = content.replace(regex2, (match, title, onConfirmStr, btnProps) => {
        modified = true;
        let cleanBtnProps = btnProps.replace(/\s*onClick=\{[^}]+\}/g, '');
        return `<Button${cleanBtnProps} onClick={() => Modal.confirm({ title: '${title}', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: ${onConfirmStr} })} />`;
    });

    if (modified) {
        if (!content.match(/\bModal\b/)) {
            content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]antd['"]/, (match, p1) => {
                return `import { ${p1.trim()}, Modal } from 'antd'`;
            });
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Modified:', filePath);
    }
}

walkDir('./prototype/src/app', processFile);
