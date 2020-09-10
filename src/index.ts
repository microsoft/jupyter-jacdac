import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ILoggerRegistry, ITextLog } from '@jupyterlab/logconsole';
import { INotebookTracker } from '@jupyterlab/notebook';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { bus } from "./Provider"
import { DEVICE_FOUND, CONNECTION_STATE, JDDevice, DEVICE_LOST, DEVICE_CHANGE, setStreamingAsync, DISCONNECT, BusState } from 'jacdac-ts';
import { RecordingDataGridPanel } from './RecordingDataGridPanel';
import { RecordingDataModel } from './RecordingDataModel';
import { PALETTE_CATEGORY, COMMAND_DISCONNECT, COMMAND_SAVE, COMMAND_OPEN_RECORDER, COMMAND_CONNECT } from './commands';
import { NotebookExtension } from './NotebookExtension';


/**
 * Initialization data for the jacdac extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jacdac',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, ILoggerRegistry, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
    loggerRegistry: ILoggerRegistry,
    nbtracker: INotebookTracker
  ) => {
    console.log(app, palette, mainMenu)
    const { commands, shell, docRegistry } = app;

    // data
    const model = new RecordingDataModel(bus)
    const widget = new RecordingDataGridPanel(commands, model)

    // notebook extensions
    docRegistry.addWidgetExtension('Notebook', new NotebookExtension(commands))

    // JACDAC events
    {
      // stream all reading registers at once
      bus.on(DEVICE_CHANGE, () => {
        const readingRegisters =
          bus.devices().map(device => device
            .services().find(srv => srv.readingRegister)
            ?.readingRegister
          ).filter(reg => !!reg)
        readingRegisters.map(reg => setStreamingAsync(reg.service, true))
        const readingFields = readingRegisters?.map(reg => reg.fields)
          ?.reduce((l, r) => l.concat(r), [])
        model.setFields(readingFields)
      })
      bus.on(DISCONNECT, () => model.setFields([]))
      setInterval(() => {
        model.addRow()
      }, 100)
    }

    // ui
    const menu = new Menu({ commands });
    menu.title.label = 'JACDAC';
    mainMenu.addMenu(menu, { rank: 80 });

    // helpers
    const log = (text: string) => {
      const logger = loggerRegistry.getLogger(
        nbtracker.currentWidget?.context.path
      );
      const msg: ITextLog = {
        type: 'text',
        level: 'info',
        data: `jacdac: ${text}`
      };
      logger?.log(msg);
    }

    // open recorder
    {
      const command = COMMAND_OPEN_RECORDER;
      commands.addCommand(command, {
        label: 'Record data from devices',
        caption: 'Open the JACDAC data recorder tab',
        execute: () => {
          //const content = new CounterWidget()
          //const widget = new MainAreaWidget<CounterWidget>({ content });
          if (!widget.isAttached) {
            // Attach the widget to the main work area if it's not there
            shell.add(widget, 'main');
          }
          // Activate the widget
          shell.activateById(widget.id);
        }
      });
      palette.addItem({ command, category: PALETTE_CATEGORY });
      menu.addItem({ command });
    }

    // connect command
    {
      const command = COMMAND_CONNECT;
      commands.addCommand(command, {
        label: 'Connect',
        caption: 'Connect to devices running JACDAC',
        isEnabled: () => bus.connectionState == BusState.Disconnected,
        execute: () => {
          bus.connectAsync()
        }
      });
      palette.addItem({ command, category: PALETTE_CATEGORY });
      menu.addItem({ command });
    }

    // disconnect command
    {
      const command = COMMAND_DISCONNECT;
      commands.addCommand(command, {
        label: 'Disconnect',
        caption: 'Disconnect from the JACDAC devices',
        isEnabled: () => bus.connectionState == BusState.Connected,
        execute: () => {
          bus.disconnectAsync()
        }
      });
      palette.addItem({ command, category: PALETTE_CATEGORY });
      menu.addItem({ command });
    }

    // save
    {
      const command = COMMAND_SAVE;
      commands.addCommand(command, {
        label: 'Save data',
        caption: 'Save data to file',
        execute: () => {
          const contents = app.serviceManager.contents;
          contents.save('./data/data.csv', {
            type: 'file',
            format: 'text',
            content: model.toCSV()
          })
        }
      });
      palette.addItem({ command, category: PALETTE_CATEGORY });
    }


    // log packet
    {
      bus.on(CONNECTION_STATE, () => {
        log(`bus: ${bus.connectionState}`)
        commands.notifyCommandChanged(COMMAND_CONNECT)
        commands.notifyCommandChanged(COMMAND_DISCONNECT)
      })
      bus.on(DEVICE_FOUND, (dev: JDDevice) => log(`bus: device found ${dev}`))
      bus.on(DEVICE_LOST, (dev: JDDevice) => log(`bus: device lost ${dev}`))
    }

  }
}

export default extension;
