export class HashMap<T>{
    private _map:{[key:string]: T};
    private _keys:string[];

    constructor(values?:Array<T>){
        this.clear();
        if(values && values.length)
            values.forEach(d =>{
                this.add(d);
            });
    }

    private setKeys(){
        this._keys = Object.keys(this._map);
    }

    public clear(){
        this._map = {};

        this.setKeys();
    }

    public add(item:T):void{
        if(!item)
            return;
        const key = item.toString();
        this._map[key] = item;

        this.setKeys();
    }

    public remove(item:T){
        if(!item)
            return;
        const key = item.toString();
        delete this._map[key];
        this.setKeys();
    }

    public contains(item:T):boolean{
        if(!item)
            return;
        const key = item.toString()
            item = this._map[key];
        return (item && item !== undefined && item !== null);
    }

    public count():number{
        return this._keys.length;
    }

    public foreach( callback: (val:T) => void  ){
        this._keys.forEach(key =>{
            const item = this._map[key];
            callback(item);
        });
    }

    public map<U>(callback:(val:T, i:number) => U): Array<U>{
        return this._keys.map((k,i) =>{
            const item = this._map[k];
            return callback(item, i);
        });
    }
}