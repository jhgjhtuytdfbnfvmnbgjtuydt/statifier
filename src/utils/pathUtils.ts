import * as fs from 'fs';
import * as path from 'path';

export function extractFolders (folderPath:string) : Array<string>{
    if(!folderPath || !folderPath.trim().length)
        return new Array<string>();

    const splitted = folderPath.split('/');
    if(splitted.length < 2)
        return splitted;
    
    let lastFolder = '',
        folders = new Array<string>();
    
    for(let i=0;i!=splitted.length;++i){
        const curr = splitted[i].trim();
        if('' == curr) 
            continue;

        if('' == lastFolder)
            lastFolder = '/';

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