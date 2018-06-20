import * as winston from 'winston';
import * as pathUtils from './pathUtils';

export interface ILogger{
    info(text: string, data?: any):void;
    error(text: string, data?: any):void;
    warning(text: string, data?: any):void
}

export interface ILoggerFactory<TOpt>{
    build(options:TOpt):ILogger;
}

export interface LoggerOptions{
    readonly basePath:string;
    readonly filename:string;
    readonly level?:string;
}

export class Logger implements ILogger{
    private readonly _logger:winston.Logger;

    constructor(options:LoggerOptions) {
        const level = options.level || 'verbose',
            opts = {
                level: level,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                transports: [
                    new winston.transports.Console({
                        format: winston.format.simple()
                    }),
                    new winston.transports.File({
                        level: level,
                        format: winston.format.json(),
                        dirname: options.basePath,
                        filename: options.filename
                    })
                ]
            };
        pathUtils.ensurePath(options.basePath);

        this._logger = winston.createLogger(opts);
    }

    private log(level: string, text: string, data?: any) {
        this._logger.log(level, text, data);
    }

    public info(text: string, data?: any):void {
        this.log("info", text, data);
    }
    
    public error(text: string, data?: any):void {
        this.log("error", text, data);
    }
    
    public warning(text: string, data?: any):void {
        this.log("warn", text, data);
    }
}

export class LoggerFactory implements ILoggerFactory<LoggerOptions>{
    build(options: LoggerOptions): ILogger {
        return new Logger(options);
    }
}



