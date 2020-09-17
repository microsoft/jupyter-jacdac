import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, IThemeManager } from '@jupyterlab/apputils';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Menu } from '@lumino/widgets';
import { IThemeMessage, JACDACWidget } from './widget';

export const COMMAND_OPEN_RECORDER = 'jacdac:open-recorder';
export const PALETTE_CATEGORY = "JACDAC"

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
      fileBrowserFactory
    });

    // dark mode
    const updateDarkMode = () => {
      const light = !!themeManager?.theme && themeManager.isLight(themeManager.theme)
      widget.postMessage(<IThemeMessage>{
        type: 'theme',
        data: {
          type: light ? 'light' : 'dark'
        }
      })
    }
    themeManager?.themeChanged.connect(updateDarkMode)
    updateDarkMode();

    // menu
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
