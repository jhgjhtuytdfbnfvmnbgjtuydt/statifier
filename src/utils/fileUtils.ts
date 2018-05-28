import * as fs from 'fs';

export function readAsync(path:string, type:string = 'utf8') : Promise<string>{
    return new Promise((resolve, reject) =>
        fs.readFile(path, type, (err, data) => {
            return err ? reject(err) : resolve(data);
        })
    );
}

export function writeAsync(path:string, content:string) : Promise<boolean>{
    return new Promise((resolve, reject) =>
        fs.writeFile(path, content, (err) => {
            return err ? reject(err) : resolve(true);
        })
    );
}