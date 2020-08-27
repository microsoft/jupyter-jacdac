import React, { useState, useEffect } from "react";
import { createUSBBus, BusState, CONNECTION_STATE } from "jacdac-ts"
import JACDACContext from "jacdac-ts/dist/types/src/react/Context";

const bus = createUSBBus();
const JACDACProvider = (props: { children?: any }) => {
    const { children } = props
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
    useEffect(() => bus.subscribe<BusState>(CONNECTION_STATE, connectionState => setConnectionState(connectionState)),[bus])

    const connectAsync = () => bus.connectAsync();
    const disconnectAsync = () => bus.disconnectAsync();
    return (
        <JACDACContext.Provider value={{ bus, connectionState, connectAsync, disconnectAsync }}>
            {children}
        </JACDACContext.Provider>
    )
}

export default JACDACProvider;
