import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IFrame } from "@jupyterlab/apputils";
import { Contents, ContentsManager } from '@jupyterlab/services';
import { toArray } from '@lumino/algorithm';

export interface IMessage {
    id?: string;
    source: 'jacdac' | 'host',
    type: string;
    data: any;
    requireAck?: boolean;
}
export interface IAckMessage extends IMessage {
    type: 'ack';
    ackId?: string;
    data: {
        status: "success" | "error";
        error: any;
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
        this.url = `${this.options.url}/tools/collector`

        this.iframe.addEventListener('message', ev => this.handleMessage((ev as MessageEvent).data), false)
    }

    get iframe(): HTMLIFrameElement {
        return this.node.querySelector('iframe');
    }

    private handleMessage(msg: IMessage) {
        if (msg?.source !== 'jacdac') return;
        try {
            switch (msg.type) {
                case 'save-text':
                    this.handleSaveTextMessage(msg as ISaveTextMessage)
                    break;
                case 'ack':
                    this.handleAck(msg as IAckMessage);
                    break;
            }
        } catch (e) {
            this.sendAck(msg, {
                message: e.message
            })
        }
    }

    private handleSaveTextMessage(msg: ISaveTextMessage) {
        const { name, data } = msg.data
        const fileName = findUniqueFileName(this.options.fileBrowserFactory, name)
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

    private sendAck(msg: IMessage, error: any) {
        this.postMessage({
            ackId: msg.id,
            data: {
                status: error ? "error" : "success",
                error
            }
        } as IAckMessage)
    }

    private postMessage(msg: IMessage) {
        msg.id = "jl:" + Math.random()
        const url = new URL(this.options.url)
        const target = `${url.protocol}${url.hostname}`
        window.parent.postMessage(msg, target)
        return Promise.resolve();
    }
}

// walks the current folder in the filebrowser for a unique new file name
function findUniqueFileName(fileBrowserFactory: IFileBrowserFactory, name: string = "data") {
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
        fileName = `${fileBrowserModel.path}/${name}-${nb}.csv`;
        fileNameIndex++
    } while (!!fileModelMap[fileName]);
    return fileName;
}
