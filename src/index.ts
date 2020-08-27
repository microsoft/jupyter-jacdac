import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { CounterWidget } from './CounterWidget';

namespace CommandIDs {
  export const RECORDER = 'create-react-widget';
}

/**
 * Initialization data for the jacdac extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jacdac',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu],
  activate: (app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu) => {

    console.log(app, palette, mainMenu)
    const { commands, shell } = app;
    const command = CommandIDs.RECORDER;

    commands.addCommand(command, {
      label: 'Record data',
      caption: 'Open the JACDAC recorder tab',
      execute: () => {
        const content = new CounterWidget()
        const widget = new MainAreaWidget<CounterWidget>({ content });
        widget.title.label = 'React Widget';
        shell.add(widget, 'main');        
      }
    });
    palette.addItem({ command, category: 'Extension Examples' });

    const exampleMenu = new Menu({ commands });

    exampleMenu.title.label = 'JACDAC';
    mainMenu.addMenu(exampleMenu, { rank: 80 });
    exampleMenu.addItem({ command });
  }
}

export default extension;
