import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { ILoggerRegistry, ITextLog } from '@jupyterlab/logconsole';
import { INotebookTracker } from '@jupyterlab/notebook';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { CounterWidget } from './CounterWidget';
import { bus } from "./Provider"
import { PACKET_RECEIVE, CONNECTION_STATE } from 'jacdac-ts';

const PALETTE_CATEGORY = "JACDAC"
namespace CommandIDs {
  export const OPEN_RECORDER = 'jacdac:open-recorder';
  export const CONNECT = 'jacdac:connect';
  export const DISCONNECT = 'jacdac:disconnect';
}

/**
 * Initialization data for the jacdac extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jacdac',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, ILoggerRegistry, INotebookTracker],
  activate: (app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
    loggerRegistry: ILoggerRegistry,
    nbtracker: INotebookTracker
    ) => {
    console.log(app, palette, mainMenu)
    const { commands, shell } = app;
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
        data: text
      };      
      logger?.log(msg);
    }

    // log packets
    bus.on(PACKET_RECEIVE, pkt => log(pkt.toString()))
    bus.on(CONNECTION_STATE, () => log(`bus: ${bus.connectionState}`))

    // open recorder
    {
      const command = CommandIDs.OPEN_RECORDER;
      commands.addCommand(command, {
        label: 'Record data from devices',
        caption: 'Open the JACDAC data recorder tab',
        execute: () => {
          const content = new CounterWidget()
          const widget = new MainAreaWidget<CounterWidget>({ content });
          widget.title.label = "JADCAC data recorder";
          shell.add(widget, 'main');
        }
      });
      palette.addItem({ command, category: PALETTE_CATEGORY });
      menu.addItem({ command });
    }

    // connect command
    {
      const command = CommandIDs.CONNECT;
      commands.addCommand(command, {
        label: 'Connect to JACDAC',
        caption: 'Connect to devices running JACDAC',
        execute: () => {
          bus.connectAsync()
        }
      });
      palette.addItem({ command, category: PALETTE_CATEGORY });
      menu.addItem({ command });
    }

    // disconnect command
    {
      const command = CommandIDs.CONNECT;
      commands.addCommand(command, {
        label: 'Disconnect from JACDAC',
        caption: 'Disconnect from the JACDAC devices',
        execute: () => {
          bus.disconnectAsync()
        }
      });
      palette.addItem({ command, category: PALETTE_CATEGORY });
      menu.addItem({ command });
    }
  }
}

export default extension;
