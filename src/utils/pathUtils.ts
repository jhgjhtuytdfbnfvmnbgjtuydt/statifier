import * as fs from 'fs';
import * as path from 'path';

export function extractFolders (folderPath:string) : Array<string>{
    const splitted = folderPath.split('/');
    if(splitted.length < 2)
        return splitted;
    
    let lastFolder = splitted[0] != "" ? splitted[0] : '/',
        folders = new Array<string>();
    
    folders.push(lastFolder);
    for(let i=1;i!=splitted.length;++i){
        const curr = splitted[i].trim();
        if('' == curr) 
            continue;
        lastFolder = path.join(lastFolder, curr)
        folders.push(lastFolder);
    }
    return folders;
}

export function ensurePath(folderPath:string) : void {
    const folders = extractFolders(folderPath);

    folders.forEach(folder => {
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }    
    });
}