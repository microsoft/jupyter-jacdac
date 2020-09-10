import { ToolbarButton } from "@jupyterlab/apputils";
import { bugIcon } from "@jupyterlab/ui-components";
import { CommandRegistry } from "@lumino/commands"
import { COMMAND_CONNECT, COMMAND_DISCONNECT } from "./commands";
import { bus } from "./Provider";
import { CONNECTION_STATE, BusState } from "jacdac-ts";

export class ConnectToolbarButton extends ToolbarButton {
    constructor(public readonly commands: CommandRegistry) {
        super({
            icon: bugIcon,
            onClick: () => {
                switch (bus.connectionState) {
                    case BusState.Disconnected:
                        this.commands.execute(COMMAND_CONNECT)
                        break;
                    case BusState.Connected:
                        this.commands.execute(COMMAND_DISCONNECT)
                        break;
                }
            },
            enabled: bus.connectionState == BusState.Connected || bus.connectionState == BusState.Disconnected,
            tooltip: bus.connectionState == BusState.Disconnected
                ? "Connect"
                : bus.connectionState == BusState.Connected
                    ? "Disconnect" : "..."
        })
        bus.on(CONNECTION_STATE, this.handleConnectionChanged)
    }

    dispose() {
        super.dispose()
        bus.off(CONNECTION_STATE, this.handleConnectionChanged)
    }

    private handleConnectionChanged = () => this.commands.notifyCommandChanged()
}
