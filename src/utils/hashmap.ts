export class HashMap{
    private _map:{[key:string]: boolean};
    private _keys:string[];

    constructor(){
        this.clear();
    }

    private setKeys(){
        this._keys = Object.keys(this._map);
    }

    public clear(){
        this._map = {};

        this.setKeys();
    }

    public add(key:string){
        this._map[key] = true;

        this.setKeys();
    }

    public remove(key:string){
        delete this._map[key];
        this.setKeys();
    }

    public contains(key:string):boolean{
        return this._map[key] === true;
    }

    public count():number{
        return this._keys.length;
    }

    public foreach( callback: (k:string) => void  ){
        this._keys.forEach(key =>{
            callback(key);
        });
    }

    public map<U>(callback:(k:string, i:number) => U): Array<U>{
        return this._keys.map(callback);
    }
}