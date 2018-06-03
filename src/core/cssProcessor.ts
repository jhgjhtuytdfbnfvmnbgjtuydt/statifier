import * as Promise from 'bluebird';
import * as path from 'path';
import { URL } from 'url';
import * as fileUtils from '../utils/fileUtils';
import * as linkUtils from '../utils/linkUtils';
import * as httpUtils from '../utils/httpUtils';
import { HashMap } from '../utils/hashmap';

const reg = new RegExp(/url(?:\(['"]?)(.*?)(?:['"]?\))/, "gmi");

export function extractImageUrls(css:string, srcDomain:URL){
    const results = new HashMap<URL>()

    let m:RegExpExecArray;
    do {
        m = reg.exec(css);
        if (m && m.length > 1) {
            const match = m[1];
            let imageUrl = match.replace("\"", "")
                           .replace("'", "");

            if(imageUrl.includes(srcDomain.host)){
                if(imageUrl.startsWith('//'))
                    imageUrl = srcDomain.protocol + imageUrl;
            }
            else if(imageUrl.startsWith('./') || imageUrl.startsWith('/'))
                imageUrl = path.join(srcDomain.origin, imageUrl);
            else 
                imageUrl = null;

            if(imageUrl)
                results.add(new URL(imageUrl));
        }
    } while (m);

    return results;
}