import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IFrame } from "@jupyterlab/apputils";
import { Contents, ContentsManager } from '@jupyterlab/services';
import { toArray } from '@lumino/algorithm';
import { PathExt } from '@jupyterlab/coreutils'

export interface IMessage {
    id?: string;
    source?: 'jacdac' | 'host',
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
export interface IStatusMessage extends IMessage {
    type: 'status',
    data: {
        status: 'ready' | 'error',
        data?: any;
        error?: any;
    }
}
export interface ISaveTextMessage extends IMessage {
    type: 'save-text';
    data: {
        name: string;
        data: string;
    }
}

export declare namespace JACDACWidget {
    interface IOptions {
        url?: string;
        contents: ContentsManager,
        fileBrowserFactory: IFileBrowserFactory;
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
        this.url = `${this.options.url}/tools/collector`

        this.handleMessage = this.handleMessage.bind(this)
        window.addEventListener('message', this.handleMessage, false)
    }

    dispose() {
        super.dispose();
        window.removeEventListener('message', this.handleMessage)
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

    private handleStatusMessage(msg: IStatusMessage) {
        console.log(`jacdac: ${msg.data.status}`, msg.data)
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

    private handleAck(msg: IAckMessage) {
        console.log(`jacdac: ack`, msg)
    }

    private sendAck(msg: IMessage, data?: any, error?: any) {
        this.postMessage({
            ackId: msg.id,
            data: {
                status: error ? "error" : "success",
                data,
                error
            }
        } as IAckMessage)
    }

    private postMessage(msg: IMessage) {
        msg.id = "jl:" + Math.random()
        msg.source = "host"
        const url = new URL(this.options.url)
        const target = `${url.protocol}${url.host}`
        this.iframe.contentWindow.postMessage(msg, target)
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