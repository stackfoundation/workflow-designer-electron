import { app, Menu } from 'electron';

import { DEBUG } from './constants';
import { translator } from './translate';

export function initMenu() {
    if (DEBUG) {
        const template: any[] = [
            {
                role: 'window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'close' }
                ]
            }
        ];

        template[0].submenu.push(
            { role: 'reload' }
        );
        template[0].submenu.push(
            { role: 'toggledevtools' }
        );

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    } else {
        Menu.setApplicationMenu(null);
    }
}