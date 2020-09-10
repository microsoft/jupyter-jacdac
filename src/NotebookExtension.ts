import { DocumentRegistry } from "@jupyterlab/docregistry";
import { NotebookPanel, INotebookModel } from "@jupyterlab/notebook";
import { IDisposable, DisposableDelegate } from "@lumino/disposable";
import { CommandRegistry } from "@lumino/commands"
import { ConnectToolbarButton } from "./ConnectToolbarButton";

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class NotebookExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
    constructor(public readonly commands: CommandRegistry) {
    }
    /**
     * Create a new extension object.
     */
    createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
        const button = new ConnectToolbarButton(this.commands)
        panel.toolbar.addItem('jacdac:connect', button);

        return new DisposableDelegate(() => {
            button.dispose();
        });
    }
}