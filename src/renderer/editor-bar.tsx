import * as path from 'path';
import * as fs from 'fs';

import { observer } from 'mobx-react';
import * as React from 'react';
import { UIState } from 'src/renderer/designer-state';
import { action } from 'mobx';
let injectSheet = require('react-jss').default;
const New = require('react-icons/lib/fa/file-o');
const Open = require('react-icons/lib/fa/folder-open-o');
const Save = require('react-icons/lib/fa/floppy-o');

const styles = (theme: any) => ({
    editorBar: {
        composes: 'pure-menu pure-menu-horizontal pure-menu-fixed',
        borderBottom: 'solid 1px #ddd',
    },
    editorBarInner: {
        composes: 'pure-menu-heading',
        fontWeight: '700',
        width: '100%',
        background: 'white'
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
        composes: 'pure-menu-link',

        '&:focus': {
            background: 'none'
        }
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
    uiState: UIState;
    modeChanged?: (yaml: boolean) => void;
    openWorkflow?: (workflow?: string) => void;
    newWorkflow?: () => void;
    save?: () => void;
    dirty: boolean;
}

@injectSheet(styles)
@observer
export class EditorBar extends React.Component<BarProps> {
    constructor(props: BarProps) {
        super(props);
    }

    private save(e: React.MouseEvent<HTMLSpanElement>) {
        if (this.props.save) {
            this.props.save();
        }
        
        e.preventDefault();
    }

    private blankNew(e: React.MouseEvent<HTMLSpanElement>) {
        if (this.props.newWorkflow) {
            this.props.newWorkflow();
        }

        e.preventDefault();
    }

    private openNew(e: React.MouseEvent<HTMLSpanElement>) {
        if (this.props.openWorkflow) {
            this.props.openWorkflow();
        }

        e.preventDefault();
    }

    private openExisting(workflow: string, e: React.MouseEvent<HTMLAnchorElement>) {
        if (this.props.openWorkflow) {
            this.props.openWorkflow(path.join(this.props.uiState.projectPath,workflow + '.wflow'));
        }
        e.preventDefault();
    }

    private get multipleWorkflows(): boolean {
        return this.props.uiState && this.props.uiState.projectWorkflows && this.props.uiState.projectWorkflows.length > 1;
    }

    private get existingWorkflow(): boolean {
        return this.props.uiState && this.props.uiState.projectPath && this.props.uiState.projectPath.length > 0;
    }

    private get yamlMode(): boolean {
        return this.props.uiState && this.props.uiState.yaml;
    }

    @action
    private setMode(e: React.MouseEvent<HTMLAnchorElement>, yaml: boolean) {
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
                        <a href="#" className={classes.menuLink} onClick={e => this.blankNew(e)}>
                            <New />
                        </a>
                    </li>
                    <li className={classes.menuItem}>
                        <a href="#" className={classes.menuLink} onClick={e => this.openNew(e)}>
                            <Open />
                        </a>
                    </li>
                    {this.existingWorkflow && <li className={classes.menuItem}>
                        {this.props.uiState &&
                            <span title={this.props.uiState.projectPath} className={classes.menuNonLink}>
                                {this.props.uiState.projectName} &gt;&nbsp;
                            </span>}
                    </li>}
                    {!this.existingWorkflow && <li className={classes.menuItem}>
                        {this.props.uiState &&
                            <span title={this.props.uiState.projectPath} className={classes.menuNonLink}>
                                New Workflow
                                {this.props.dirty && <span>*</span>}
                            </span>}
                    </li>}
                    {this.existingWorkflow && <li className={this.multipleWorkflows ? classes.menuItemWithChildren : classes.menuItem}>
                        {this.multipleWorkflows &&
                            <a href="#" className={classes.menuLink}>
                                {this.props.uiState.workflowName}
                                {this.existingWorkflow && this.props.dirty && <span>*</span>}
                            </a>}
                        {!this.multipleWorkflows &&
                            <span title={this.props.uiState.projectPath} className={classes.menuNonLink}>
                                {this.props.uiState.workflowName}
                                {this.existingWorkflow && this.props.dirty && <span>*</span>}
                            </span>}
                        {this.multipleWorkflows &&
                            <ul className="pure-menu-children">
                                {this.props.uiState.projectWorkflows.map((workflow, i) =>
                                    <li className={classes.menuItem} key={'wflow-' + i}>
                                        <a href="#" onClick={e => this.openExisting(workflow, e)} className={classes.menuLink}>
                                            {workflow}
                                        </a>
                                    </li>)}
                            </ul>}
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
