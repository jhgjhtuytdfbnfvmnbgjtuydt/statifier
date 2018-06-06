export function toURL(value:string):URL{
    try{
        return new URL(value);
    }catch(err){
        if(!value.startsWith('http')){
            if(value.startsWith('//'))
                return new URL('http:' + value);
            return new URL('http://' + value);
        }

        throw err;
    }
}

export function getRelativeUrl(absoluteUrl:string, domain:string):string{
    const domainUrl = toURL(domain),
         result = absoluteUrl.substring(absoluteUrl.lastIndexOf(domainUrl.host) + domainUrl.host.length);
    return result;
}