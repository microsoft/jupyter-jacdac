import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, IThemeManager } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { JACDACWidget } from './widget';
import { Menu } from '@lumino/widgets';

export const PALETTE_CATEGORY = "JACDAC"
export const COMMAND_COLLECTOR = 'jacdac:collector';
export const COMMAND_MODEL_UPLOADER = 'jacdac:model-uploader';

/**
 * Initialization data for the jacdac extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jacdac',
  autoStart: true,
  requires: [IFileBrowserFactory],
  optional: [ICommandPalette, IMainMenu, IThemeManager, ILauncher],
  activate: (
    app: JupyterFrontEnd,
    fileBrowserFactory: IFileBrowserFactory,
    palette: ICommandPalette | null,
    mainMenu: IMainMenu | null,
    themeManager: IThemeManager | null,
    launcher: ILauncher | null
  ) => {
    const { commands, shell, serviceManager } = app;
    const { contents } = serviceManager

    // iframe host
    const widget = new JACDACWidget({
      contents,
      fileBrowserFactory,
      themeManager
    });

    // add JACDAC to view menu
    const group: Menu.IItemOptions[] = [];

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
        palette?.addItem({ command, category: PALETTE_CATEGORY });
        group.push({ command });
        launcher?.add({
          command: command,
          category: 'JACDAC',
          rank: 1
        });
      }
    }

    addCommand(COMMAND_COLLECTOR, "tools/collector", "JACDAC - Collect data", "Record live data from sensors on the bus")
    addCommand(COMMAND_MODEL_UPLOADER, "tools/model-uploader", "JACDAC - Deploy models", "Deploy TFLite models to devices")

    mainMenu.viewMenu.addGroup(group, 60);
  }
}

export default extension;
