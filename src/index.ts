import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Menu } from '@lumino/widgets';
import { JACDACWidget } from './widget';

export const COMMAND_OPEN_RECORDER = 'jacdac:open-recorder';
export const PALETTE_CATEGORY = "JACDAC"

/**
 * Initialization data for the jacdac extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jacdac',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, IFileBrowserFactory],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
    fileBrowserFactory: IFileBrowserFactory
  ) => {
    console.log(app, palette, mainMenu)
    const { commands, shell, serviceManager } = app;
    const { contents } = serviceManager

    const widget = new JACDACWidget({
      contents,
      fileBrowserFactory
    });

    // ui
    const menu = new Menu({ commands });
    menu.title.label = 'JACDAC';
    mainMenu.addMenu(menu, { rank: 80 });

    // open recorder
    {
      const command = COMMAND_OPEN_RECORDER;
      commands.addCommand(command, {
        label: 'Record data from devices',
        caption: 'Open the JACDAC data recorder tab',
        execute: () => {
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
  }
}

export default extension;
