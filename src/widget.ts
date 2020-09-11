import { IFrame } from "@jupyterlab/apputils";

export class JACDACWidget extends IFrame {
    constructor(options?: JACDACWidget.IOptions) {
        super({
            referrerPolicy: 'no-referrer',
        })
        this.id = 'jacdac'
        this.title.label = "JACDAC";
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-top-navigation allow-downloads allow-popups allow-popups-to-escape-sandbox allow-forms')
        this.iframe.setAttribute('allow', 'usb')

        const domain = options?.url || 'https://microsoft.github.io/jacdac-ts';
        this.url = `${domain}/tools/collector`
    }

    get iframe() {
        return this.node.querySelector('iframe');
    }
}

/**
 * A namespace for IFrame widget statics.
 */
export declare namespace JACDACWidget {
    interface IOptions {
        url?: string;
    }
}