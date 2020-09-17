import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, IThemeManager } from '@jupyterlab/apputils';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Menu } from '@lumino/widgets';
import { JACDACWidget } from './widget';

export const PALETTE_CATEGORY = "JACDAC"
export const COMMAND_COLLECTOR = 'jacdac:collector';
export const COMMAND_UPDATER = 'jacdac:updater';
export const COMMAND_NAMER = 'jacdac:namer';
export const COMMAND_PLAYER = 'jacdac:player';

/**
 * Initialization data for the jacdac extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jacdac',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, IFileBrowserFactory, IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
    fileBrowserFactory: IFileBrowserFactory,
    themeManager: IThemeManager
  ) => {
    const { commands, shell, serviceManager } = app;
    const { contents } = serviceManager

    // iframe host
    const widget = new JACDACWidget({
      contents,
      fileBrowserFactory,
      themeManager
    });

    // menu
    const menu = new Menu({ commands });
    menu.title.label = 'JACDAC';
    mainMenu.addMenu(menu, { rank: 80 });

    const addCommand = (id: string, path: string, label: string, caption: string) => {
      // open recorder
      {
        const command = id;
        commands.addCommand(command, {
          label,
          caption,
          execute: () => {
            if (!widget.isAttached) {
              // Attach the widget to the main work area if it's not there
              shell.add(widget, 'main');
            }
            // Activate the widget
            widget.setPath(path)
            shell.activateById(widget.id);
          }
        });
        palette.addItem({ command, category: PALETTE_CATEGORY });
        menu.addItem({ command });
      }
    }
    
    addCommand(COMMAND_COLLECTOR, "tools/collector", "Collect sensor data", "Record live data from sensors on the bus")
    addCommand(COMMAND_NAMER, "tools/namer", "Assign names to devices", "Identify devices to collect relevant data")
    addCommand(COMMAND_UPDATER, "tools/updater", "Check for firmware updates", "Check for firmware updates for your sensors")
    addCommand(COMMAND_PLAYER, "tools/player", "Replay traces", "Replay packet traces recorded using a logic analyser")
  }
}

export default extension;
