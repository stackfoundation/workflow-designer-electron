import * as path from 'path';
import * as fs from 'fs';

import * as React from 'react';
let injectSheet = require('@tiagoroldao/react-jss').default;
const File = require('react-icons/lib/fa/file-o');

var electron = require('electron');
var currentWindow = electron.remote.getCurrentWindow();

const styles = (theme: any) => ({
    editorHeader: {
        composes: 'pure-menu pure-menu-horizontal pure-menu-fixed',
        borderBottom: 'solid 1px #ddd',
    },
    editorTitle: {
        composes: 'pure-menu-heading',
        fontWeight: '700'
    },
    editorMenu: {
        composes: 'pure-menu-list',
        float: 'right'
    },
    menuItem: {
        composes: 'pure-menu-item'
    },
    menuItemActive: {
        composes: 'pure-menu-item pure-menu-selected'
    },
    menuLink: {
        composes: 'pure-menu-link'
    }
});

interface BarState {
    projectName: string;
    projectPath: string;
    workflowName: string;
    yaml: boolean;
}

@injectSheet(styles)
export class EditorBar extends React.Component<{ classes?: any }, BarState> {
    constructor(props: { classes?: any }) {
        super(props);
    }

    public componentDidMount() {
        if ((currentWindow as any).args) {
            let args = (currentWindow as any).args;
            if (args.length && args.length > 1) {
                try {
                    if (fs.statSync(args[1]).isFile()) {
                        this.openWorkflow(args[1]);
                    }
                } catch (e) { }
            }
        }
    }

    private openWorkflow(workflow: string) {
        if (workflow) {
            let project = path.dirname(workflow);
            if (path.basename(project) == 'workflows') {
                project = path.dirname(project);
            }

            let projectName = path.basename(project);

            let workflowName = path.basename(workflow);
            if (workflowName.endsWith('.wflow')) {
                workflowName = workflowName.substring(0, workflowName.length - 6);
            }

            let code = fs.readFileSync(workflow).toString();

            this.setState({ workflowName: workflowName, projectPath: project, projectName: projectName });
        }
    }

    private openNew(e: React.MouseEvent<HTMLSpanElement>) {
        let path = electron.remote.dialog.showOpenDialog(currentWindow,
            {
                title: "Open workflow",
                filters: [
                    { name: 'Workflows', extensions: ['wflow'] }
                ]
            });
        if (path && path.length > 0) {
            this.openWorkflow(path[0]);
        }
        e.preventDefault();
    }

    public render() {
        let classes = this.props.classes || {};
        return <div className={classes.editorHeader}>
            <div className={classes.editorTitle}>
                <ul className={classes.editorMenu}>
                    <li className={classes.menuItem}>
                        <a href="#" className={classes.menuLink} onClick={e => this.openNew(e)}>
                            <File /> {this.state && <span>{this.state.projectName}</span>}
                        </a>
                    </li>
                    <li className={classes.menuItem}>
                        <a href="#" className={classes.menuLink}>
                            {this.state && <span>&gt; {this.state.workflowName}</span>}
                        </a>
                    </li>
                    <li className={(this.state && this.state.yaml) ? classes.menuItem : classes.menuItemActive}>
                        <a href="#" onClick={_ => this.setState({ yaml: false })} className={classes.menuLink}>Workflow</a>
                    </li>
                    <li className={(this.state && this.state.yaml) ? classes.menuItemActive : classes.menuItem}>
                        <a href="#" onClick={_ => this.setState({ yaml: true })} className={classes.menuLink}>YAML</a>
                    </li>
                </ul>
            </div>
        </div>;
    }
}
