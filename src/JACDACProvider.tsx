import React, { useState, useEffect } from "react";
import { createUSBBus, BusState, CONNECTION_STATE, JDBus } from "jacdac-ts"

import { createContext } from "react";
import { JDDataModel } from "./JDDataModel";
import { CommandRegistry } from "@lumino/commands"

// JACDAC context
export interface JDContextProps {
    bus: JDBus,
    connectionState: BusState,
    connectAsync: () => Promise<void>,
    disconnectAsync: () => Promise<void>,
    model: JDDataModel,
    commands: CommandRegistry
}
const JACDACContext = createContext<JDContextProps>({
    bus: undefined,
    connectionState: BusState.Disconnected,
    connectAsync: undefined,
    disconnectAsync: undefined,
    model: undefined,
    commands: undefined
});
JACDACContext.displayName = "JACDAC";
export const bus = createUSBBus();
export const model = new JDDataModel(bus)

export const JACDACProvider = (props: {
    commands: CommandRegistry,
    children?: any
}) => {
    const { children, commands } = props
    const [firstConnect, setFirstConnect] = useState(false)
    const [connectionState, setConnectionState] = useState(bus.connectionState);

    // connect in background on first load
    useEffect(() => {
        if (!firstConnect && bus.connectionState == BusState.Disconnected) {
            setFirstConnect(true)
            bus.connectAsync(true);
        }
        return () => { }
    })

    // subscribe to connection state changes
    useEffect(() => bus.subscribe<BusState>(CONNECTION_STATE, connectionState => setConnectionState(connectionState)), [bus])

    const connectAsync = () => bus.connectAsync();
    const disconnectAsync = () => bus.disconnectAsync();
    return (
        <JACDACContext.Provider value={{ bus, connectionState, connectAsync, disconnectAsync, model, commands }}>
            {children}
        </JACDACContext.Provider>
    )
}

export default JACDACContext;
