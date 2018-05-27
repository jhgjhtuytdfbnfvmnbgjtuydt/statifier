import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';

export function downloadFile(fromUrl:string, destPath:string){
    if(fs.existsSync(destPath)){
        fs.unlinkSync(destPath);
    }

    return new Promise((resolve,reject) =>{
        const file = fs.createWriteStream(destPath),
            cb = (response:any) =>{
                response.pipe(file);
                file.on('finish', function() {
                    file.close();
                    resolve();
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