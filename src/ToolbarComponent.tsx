import { CommandToolbarButtonComponent } from "@jupyterlab/apputils";
import React, { useContext } from "react";
import { COMMAND_CONNECT, COMMAND_DISCONNECT, COMMAND_SAVE } from "./commands";
import JACDACContext from "./JACDACProvider";


export default function ToolbarComponent() {
    const { commands } = useContext(JACDACContext)
    return <div>
        <CommandToolbarButtonComponent
            commands={commands} id={COMMAND_CONNECT} />
       <CommandToolbarButtonComponent
            commands={commands} id={COMMAND_DISCONNECT} />
       <CommandToolbarButtonComponent
            commands={commands} id={COMMAND_SAVE} />
    </div>
}