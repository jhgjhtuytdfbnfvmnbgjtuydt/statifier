import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as pathUtils from './pathUtils';

export function downloadFile(fromUrl:string, destPath:string){
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

        if(fromUrl.startsWith('https'))
            https.get(fromUrl, cb).on('error', onError);
        else
            http.get(fromUrl, cb).on('error', onError);
    });
}


export function mirrorDownload(url:string, rootPath:string){
    const srcUrl = new URL(url),
    srcFilePath = path.dirname(srcUrl.pathname),
    destFileFolder = path.join(rootPath, srcFilePath),
    filename = path.basename(srcUrl.pathname),
    destFilePath = path.join(destFileFolder, filename);

    pathUtils.ensurePath(destFileFolder);
    return downloadFile(url, destFilePath);
}