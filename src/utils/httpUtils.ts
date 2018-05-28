import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as Promise from 'bluebird';

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
                fs.unlinkSync(destPath);
                reject();
            };

        if(fromUrl.startsWith('https'))
            https.get(fromUrl, cb).on('error', onError);
        else
            http.get(fromUrl, cb).on('error', onError);
    });
}