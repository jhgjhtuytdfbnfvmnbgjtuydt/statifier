export class Queue<T>{
    private _items:Array<T>;
    private _head:number = 0;

    constructor(){
        this.clear();
    }

    public clear(){
        this._items = new Array<T>();
        this._head = 0;
    }

    public enqueue(item:T){
        if(this._items.length <= this._head)
            this._items[this._head] = item;
        else
            this._items.push(item);
        this._head++;
    }

    public dequeue():T{
        if(!this.count())
            return undefined;
        this._head--;
        const item = this._items[this._head];
        this._items[this._head] = undefined;
        
        return item;
    }

    public count():number{
        return this._head;
    }

    public peek():T{
        if(!this.count())
            return undefined;
        return this._items[this._head - 1];
    }
}