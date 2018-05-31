import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as path from 'path';
import { URL } from 'url';
import * as pathUtils from './pathUtils';

export function downloadFile(srcUrl:URL, destPath:string){
    if(fs.existsSync(destPath)){
        fs.unlinkSync(destPath);
    }

    return new Promise<string>((resolve,reject) =>{
        const file = fs.createWriteStream(destPath),
            cb = (response:any) =>{
                response.pipe(file);
                file.on('finish', function() {
                    file.close();
                    resolve(destPath);
                });
            }, onError = (err:any) =>{
                try{
                    if(fs.existsSync(destPath))
                        fs.unlinkSync(destPath);
                }catch(err2){}
                reject(err);
            };

        if(srcUrl.protocol === 'https:')
            https.get(srcUrl, cb).on('error', onError);
        else
            http.get(srcUrl, cb).on('error', onError);
    });
}


export function mirrorDownload(srcUrl:URL, rootPath:string){
    const srcFilePath = path.dirname(srcUrl.pathname),
    destFileFolder = path.join(rootPath, srcFilePath),
    filename = path.basename(srcUrl.pathname),
    destFilePath = path.join(destFileFolder, filename);

    pathUtils.ensurePath(destFileFolder);
    return downloadFile(srcUrl, destFilePath);
}