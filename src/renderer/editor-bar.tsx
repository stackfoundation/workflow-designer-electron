import * as path from 'path';
import * as fs from 'fs';

import { observer } from 'mobx-react';
import * as React from 'react';
let injectSheet = require('@tiagoroldao/react-jss').default;
const Open = require('react-icons/lib/fa/folder-open-o');
const Save = require('react-icons/lib/fa/floppy-o');

var electron = require('electron');
var currentWindow = electron.remote.getCurrentWindow();

const styles = (theme: any) => ({
    editorBar: {
        composes: 'pure-menu pure-menu-horizontal pure-menu-fixed',
        borderBottom: 'solid 1px #ddd',
    },
    editorBarInner: {
        composes: 'pure-menu-heading',
        fontWeight: '700',
        width: '100%'
    },
    projectMenu: {
        composes: 'pure-menu-list'
    },
    workflowTabs: {
        composes: 'pure-menu-list',
        float: 'right',
        marginRight: '2em'
    },
    menuItem: {
        composes: 'pure-menu-item'
    },
    menuItemWithChildren: {
        composes: 'pure-menu-item pure-menu-has-children pure-menu-allow-hover'
    },
    menuItemActive: {
        composes: 'pure-menu-item pure-menu-selected'
    },
    menuLink: {
        composes: 'pure-menu-link'
    },
    menuNonLink: {
        composes: 'pure-menu-link',
        cursor: 'auto',
        '&:hover': {
            background: 'none'
        },
        '&:active': {
            background: 'none'
        }
    }
});

interface BarProps {
    classes?: any;
    modeChanged?: (yaml: boolean) => void;
    workflowOpened?: (workflow: string) => void;
    save?: () => void;
    dirty: boolean;
}

interface BarState {
    projectName: string;
    projectPath: string;
    projectWorkflows: string[];
    workflowName: string;
    yaml: boolean;
}

@injectSheet(styles)
@observer
export class EditorBar extends React.Component<BarProps, BarState> {
    constructor(props: BarProps) {
        super(props);
    }

    componentWillMount() {
        this.setState({});
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

    private listProjectWorkflows(projectDirectory: string): string[] {
        let children = fs.readdirSync(projectDirectory);
        if (children && children.length > 0) {
            children = children
                .filter(workflow => workflow && workflow.endsWith('.wflow'))
                .map(workflow => workflow.substring(0, workflow.length - 6));
        }

        return children;
    }

    private openWorkflow(workflow: string) {
        if (workflow) {
            let project = path.dirname(workflow);
            let children: string[] = [];
            if (path.basename(project) == 'workflows') {
                children = this.listProjectWorkflows(project);
                project = path.dirname(project);
            }

            let projectName = path.basename(project);

            let workflowName = path.basename(workflow);
            if (workflowName.endsWith('.wflow')) {
                workflowName = workflowName.substring(0, workflowName.length - 6);
            }

            this.setState({
                workflowName: workflowName,
                projectPath: project,
                projectName: projectName,
                projectWorkflows: children
            });

            if (this.props.workflowOpened) {
                this.props.workflowOpened(workflow);
            }
        }
    }

    private openProjectWorkflow(workflow: string) {
        if (workflow && this.state) {
            let workflowPath = path.join(this.state.projectPath, 'workflows', workflow + '.wflow');
            this.openWorkflow(workflowPath);
        }
    }

    private save(e: React.MouseEvent<HTMLSpanElement>) {
        if (this.props.save) {
            this.props.save();
        }
        
        e.preventDefault();
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

    private openExisting(workflow: string, e: React.MouseEvent<HTMLAnchorElement>) {
        this.openProjectWorkflow(workflow);
        e.preventDefault();
    }

    private get multipleWorkflows(): boolean {
        return this.state && this.state.projectWorkflows && this.state.projectWorkflows.length > 1;
    }

    private get existingWorkflow(): boolean {
        return this.state && this.state.projectPath && this.state.projectPath.length > 0;
    }

    private get yamlMode(): boolean {
        return this.state && this.state.yaml;
    }

    private setMode(e: React.MouseEvent<HTMLAnchorElement>, yaml: boolean) {
        this.setState({ yaml: yaml });

        if (this.props.modeChanged) {
            this.props.modeChanged(yaml);
        }

        e.preventDefault();
    }

    public render() {
        let classes = this.props.classes || {};
        return <div className={classes.editorBar}>
            <div className={classes.editorBarInner}>
                <ul className={classes.projectMenu}>
                    <li className={classes.menuItem}>
                        <a href="#" className={classes.menuLink} onClick={e => this.openNew(e)}>
                            <Open />
                        </a>
                    </li>
                    {this.existingWorkflow && <li className={classes.menuItem}>
                        {this.state &&
                            <span title={this.state.projectPath} className={classes.menuNonLink}>
                                {this.state.projectName} &gt;&nbsp;
                            </span>}
                    </li>}
                    {this.existingWorkflow && <li className={this.multipleWorkflows ? classes.menuItemWithChildren : classes.menuItem}>
                        <a href="#" className={classes.menuLink}>
                            {this.state.workflowName}
                        </a>
                        {this.multipleWorkflows &&
                            <ul className="pure-menu-children">
                                {this.state.projectWorkflows.map((workflow, i) =>
                                    <li className={classes.menuItem} key={'wflow-' + i}>
                                        <a href="#" onClick={e => this.openExisting(workflow, e)} className={classes.menuLink}>
                                            {workflow}
                                        </a>
                                    </li>)}
                            </ul>}
                    </li>}
                    {this.existingWorkflow && this.props.dirty &&
                        <li className={classes.menuItem}>
                            <span title={this.state.projectPath} className={classes.menuNonLink}>
                                (modified)
                            </span>
                        </li>}
                    {this.props.dirty &&
                        <li className={classes.menuItem}>
                            <a href="#" className={classes.menuLink} onClick={e => this.save(e)}>
                                <Save />
                            </a>
                        </li>}
                </ul>
                <ul className={classes.workflowTabs}>
                    <li className={this.yamlMode ? classes.menuItem : classes.menuItemActive}>
                        <a href="#" onClick={e => this.setMode(e, false)} className={classes.menuLink}>Workflow</a>
                    </li>
                    <li className={this.yamlMode ? classes.menuItemActive : classes.menuItem}>
                        <a href="#" onClick={e => this.setMode(e, true)} className={classes.menuLink}>YAML</a>
                    </li>
                </ul>
            </div>
        </div>;
    }
}
