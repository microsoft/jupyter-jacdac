import { ReactWidget } from '@jupyterlab/apputils';

import React, { useContext, useState } from 'react';
import JACDACContext, { JACDACProvider } from './JACDACProvider';
import { CommandRegistry } from "@lumino/commands"
import ToolbarComponent from './ToolbarComponent';
import { DEVICE_CHANGE, JDField } from 'jacdac-ts'
import { Checkbox, InputGroup } from '@jupyterlab/ui-components';
import useEventRaised from './useEventRaised';

/**
 * React component for a counter.
 *
 * @returns The React component
 */
const JDComponent = (): JSX.Element => {
  const { bus } = useContext(JACDACContext)
  const [fields, setFields] = useState<JDField[]>([])
  const [fieldsSelected] = useState<string[]>([])

  useEventRaised(DEVICE_CHANGE, bus, () => {
    const readingRegisters =
      bus.devices().map(device => device
        .services().find(srv => srv.readingRegister)
        ?.readingRegister
      ).filter(reg => !!reg)
    const readingFields = readingRegisters?.map(reg => reg.fields)
      ?.reduce((l, r) => l.concat(r), [])

    setFields(readingFields)
  })

  return <div>
    <ToolbarComponent />
    <InputGroup>
      {fields.map(field => <Checkbox checked={fieldsSelected.indexOf(field.id) > -1} label={field.id} />)}
    </InputGroup>
  </div>
};

/**
 * A Counter Lumino Widget that wraps a CounterComponent.
 */
export class RecorderWidget extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */
  constructor(public readonly commands: CommandRegistry) {
    super();
  }

  render(): JSX.Element {
    return <JACDACProvider commands={this.commands}>
      <JDComponent />
    </JACDACProvider>
  }
}