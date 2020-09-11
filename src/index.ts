import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ILoggerRegistry } from '@jupyterlab/logconsole';
import { INotebookTracker } from '@jupyterlab/notebook';

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
  requires: [ICommandPalette, IMainMenu, ILoggerRegistry, INotebookTracker, IFileBrowserFactory],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
    loggerRegistry: ILoggerRegistry,
    nbtracker: INotebookTracker,
    fileBrowserFactory: IFileBrowserFactory
  ) => {
    console.log(app, palette, mainMenu)
    const { commands, shell } = app;

    const widget = new JACDACWidget();

    // ui
    const menu = new Menu({ commands });
    menu.title.label = 'JACDAC';
    mainMenu.addMenu(menu, { rank: 80 });

    // helpers
    /*
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
    */

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

// walks the current folder in the filebrowser for a unique new file name
/*
function findUniqueFileName(fileBrowserFactory: IFileBrowserFactory, label: string = "data") {
  const fileBrowserModel = fileBrowserFactory.defaultBrowser.model;
  const fileModels = toArray(fileBrowserModel.items());
  const fileModelMap: { [path: string]: Contents.IModel; } = {};
  for (const fileModel of fileModels) {
    fileModelMap[fileModel.path] = fileModel;
  }

  let fileNameIndex = 0;
  let fileName = '';
  do {
    const nb = fileNameIndex.toString().padStart(3,"0")
    fileName = `${fileBrowserModel.path}/${label}-${nb}.csv`;
    fileNameIndex++
  } while (!!fileModelMap[fileName]);
  return fileName;
}
*/

export default extension;
