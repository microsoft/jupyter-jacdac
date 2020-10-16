import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IFrame, IThemeManager } from "@jupyterlab/apputils";
import { Contents, ContentsManager } from '@jupyterlab/services';
import { toArray } from '@lumino/algorithm';
import { PathExt } from '@jupyterlab/coreutils'

/** JACDAC IFrame Message protocol */
export interface IMessage {
    id?: string;
    source: 'jacdac',
    type: string;
    data: any;
    requireAck?: boolean;
}
export interface IAckMessage extends IMessage {
    type: 'ack';
    ackId?: string;
    data: {
        status: "success" | "error";
        data?: any;
        error?: any;
    }
}
export type LogLevel = 'error' | 'warn' | 'log' | 'info' | 'debug'
export interface ILogMessage extends IMessage {
    type: 'log',
    data: {
        level?: LogLevel,
        message: any
    }
}
export interface IThemeMessage extends IMessage {
    type: 'theme',
    data: {
        type: 'light' | 'dark'
    }
}
export type Status = 'unknown' | 'ready'
export interface IStatusMessage extends IMessage {
    type: 'status',
    data: {
        status: Status,
    }
}
export interface ISaveTextMessage extends IMessage {
    type: 'save-text';
    data: {
        name: string;
        data: string;
    }
}

export interface IFile {
    name: string;
    path: string;
    size: number;
}

export interface IModelListMessage extends IMessage {
    type: 'model-list',
    data: {
        models: IFile[];
    }
}

export interface IFileLoadMessage extends IMessage {
    type: 'file-load',
    requireAck: true,
    data: {
        path: string;
    }
}
/** End JACDAC protocol */

export declare namespace JACDACWidget {
    interface IOptions {
        url?: string;
        contents: ContentsManager,
        fileBrowserFactory: IFileBrowserFactory;
        themeManager: IThemeManager;
    }
}

export class JACDACWidget extends IFrame {
    constructor(public readonly options: JACDACWidget.IOptions) {
        super({
            referrerPolicy: 'no-referrer',
        })
        this.id = 'jacdac'
        this.title.label = "JACDAC";
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-top-navigation allow-downloads allow-popups allow-popups-to-escape-sandbox allow-forms')
        this.iframe.setAttribute('allow', 'usb')

        this.options.url = this.options?.url || 'https://microsoft.github.io/jacdac-ts';

        if (/jddbg=1/.test(window.location.href))
            this.options.url = 'http://localhost:8000'

        this.options.url = PathExt.removeSlash(this.options.url)

        this.handleMessage = this.handleMessage.bind(this)
        window.addEventListener('message', this.handleMessage, false)

        this.setPath("tools/collector")
        this.options.themeManager?.themeChanged.connect(() => this.updateDarkMode());
        this.options.fileBrowserFactory.defaultBrowser.model.pathChanged.connect(() => this.updateModels())
        this.options.fileBrowserFactory.defaultBrowser.model.refreshed.connect(() => this.updateModels())
    }

    dispose() {
        super.dispose();
        window.removeEventListener('message', this.handleMessage)
    }

    setPath(path: string) {
        path = PathExt.removeSlash(path)
        this.url = `${this.options.url}/${path}?widget=1`
    }

    get iframe(): HTMLIFrameElement {
        return this.node.querySelector('iframe');
    }

    private handleMessage(ev: Event) {
        const msg = (ev as MessageEvent).data;
        if (msg?.source !== 'jacdac') return;
        try {
            switch (msg.type) {
                case 'status':
                    this.handleStatusMessage(msg as IStatusMessage)
                    break;
                case 'save-text':
                    this.handleSaveTextMessage(msg as ISaveTextMessage)
                    break;
                case 'file-load':
                    this.handleFileLoadMessage(msg as IFileLoadMessage)
                    break;
                case 'ack':
                    this.handleAck(msg as IAckMessage);
                    break;
            }
        } catch (e) {
            this.sendAck(msg, undefined, {
                message: e.message
            })
        }
    }

    // dark mode
    private updateDarkMode() {
        const { themeManager } = this.options;
        const light = !!themeManager?.theme && themeManager.isLight(themeManager.theme)
        this.postMessage(<IThemeMessage>{
            type: 'theme',
            data: {
                type: light ? 'light' : 'dark'
            }
        })
    }

    private updateModels() {
        // scan current folder for .tflite files
        const fileBrowserModel = this.options.fileBrowserFactory.defaultBrowser.model;
        const models = toArray(fileBrowserModel.items())
            .filter(fileModel => /\.(tflite|ml4f)$/.test(fileModel.path))
            .map(fileModel =>
                ({
                    name: fileModel.name,
                    path: fileModel.path,
                    size: fileModel.size
                } as IFile)
            )
        this.postMessage(<IModelListMessage>{
            type: 'model-list',
            data: {
                models
            }
        })
    }

    private handleStatusMessage(msg: IStatusMessage) {
        switch (msg.data.status) {
            case 'ready':
                this.updateDarkMode()
                break;
        }
        this.sendAck(msg)
    }

    private handleSaveTextMessage(msg: ISaveTextMessage) {
        const { name, data } = msg.data
        const extname = PathExt.extname(name)
        const basename = name.substr(0, name.length - extname.length).replace(/\d+$/, '');
        const fileName = findUniqueFileName(this.options.fileBrowserFactory, basename, extname)
        this.options.contents.save(fileName, {
            type: 'file',
            format: 'text',
            content: data
        })
        this.options.fileBrowserFactory.defaultBrowser.model.refresh()
        this.sendAck(msg, undefined)
    }

    private async handleFileLoadMessage(msg: IFileLoadMessage) {
        const { path } = msg.data;
        const model = await this.options.contents.get(path, { content: true });
        const content = model?.content;
        this.sendAck(msg, { content }, !content && "file not found")
    }

    private handleAck(msg: IAckMessage) {
        console.log(`jacdac: ack`, msg)
    }

    private sendAck(msg: IMessage, data?: any, error?: any) {
        if (!msg.requireAck) return;

        this.postMessage({
            type: "ack",
            ackId: msg.id,
            data: {
                status: error ? "error" : "success",
                data,
                error
            }
        } as IAckMessage)
    }

    postMessage(msg: IMessage) {
        msg.id = "jl:" + Math.random()
        msg.source = "jacdac"
        const url = new URL(this.options.url)
        const target = `${url.protocol}${url.host}`
        this.iframe.contentWindow?.postMessage(msg, target)
        return Promise.resolve();
    }
}

// walks the current folder in the filebrowser for a unique new file name
function findUniqueFileName(fileBrowserFactory: IFileBrowserFactory, base: string, ext: string) {
    const fileBrowserModel = fileBrowserFactory.defaultBrowser.model;
    const fileModels = toArray(fileBrowserModel.items());
    const fileModelMap: { [path: string]: Contents.IModel; } = {};
    for (const fileModel of fileModels) {
        fileModelMap[fileModel.path] = fileModel;
    }
    let fileNameIndex = 0;
    let fileName = '';
    do {
        const nb = fileNameIndex.toString().padStart(3, "0")
        fileName = `${fileBrowserModel.path}/${base}-${nb}${ext}`;
        fileNameIndex++
    } while (!!fileModelMap[fileName]);
    return fileName;
}
