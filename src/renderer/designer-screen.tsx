import * as fs from 'fs';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStrict, observable } from 'mobx';
import { observer } from 'mobx-react';
let injectSheet = require('react-jss').default;

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/elegant.css';

let jss: any = require('react-jss/lib/jss').default,
    JssProvider: any = require('react-jss').JssProvider,
    ThemeProvider: any = require('react-jss').ThemeProvider,
    jssComposer: any = require('jss-compose').default,
    jssNested: any = require('jss-nested').default;

import 'purecss/build/pure.css';
import 'purecss/build/grids-responsive.css';
import './less/website.less';

import { CustomInputIO } from '@stackfoundation/workflow-designer/lib/models/custom-input';
import { WorkflowEditor } from '@stackfoundation/workflow-designer/lib/components/workflow-editor';
import { EditorBar } from './editor-bar';
import { DesignerState } from './designer-state';

import 'codemirror/mode/yaml/yaml';
import {Controlled as CodeMirror} from 'react-codemirror2';

var electron = require('electron');
var currentWindow = electron.remote.getCurrentWindow();

jss.use(jssComposer());
jss.use(jssNested());

const styles = (theme: any) => ({
    editorContainer: {
    },
    editorBody: {
        padding: '63px 0 0 0',
    },
    editor: {
        composes: 'editor',
        fontFamily: 'Courier New',
        fontSize: '16px',

        '& .CodeMirror': {
            position: 'fixed',
            top: '53px',
            left: 0,
            right: 0,
            bottom: 0,
            height: 'auto'
        },

        '& .CodeMirror-lines': {
            paddingTop: '30px'
        }
    },
    downloadSection: {
        composes: 'links',
        padding: '0 20px 0 0'
    },
    button: {
        marginTop: '15px',
        textAlign: 'center'
    },
    title: {
        fontWeight: '700',
        margin: '40px 0 10px 0'
    },
    errAlert: {
        position: 'fixed',
        top: '53px',
        right: 0,
        left: 0,
        zIndex: 1,
        background: '#ffae9c',
        color: '#730f0f',
        display: 'block',
        textAlign: 'center',
        padding: '3px',
        borderBottom: '2px solid #ca1212',
    }
});

@injectSheet(styles)
@observer
export class DesignerScreen extends React.Component<{ classes?: any }, {}> {
    @observable private designerState: DesignerState = new DesignerState();

    constructor(props: { classes?: any }) {
        super(props);
        useStrict(true);
    }

    public componentDidMount() {
        if ((currentWindow as any).args) {
            let args = (currentWindow as any).args;
            if (args.length && args.length > 1) {
                try {
                    if (fs.statSync(args[1]).isFile()) {
                        this.designerState.openWorkflow(args[1]);
                    }
                } catch (e) { }
            }
        }
    }

    componentWillUnmount() {
        this.designerState.onDestroy();
    }

    private setMode(yamlMode: boolean) {
        this.designerState.setMode(yamlMode);
    }

    private runDirtyFileCheck (): boolean {
        if (this.designerState.dirty) {
            let currentWindow = electron.remote.getCurrentWindow();
            let response = electron.remote.dialog.showMessageBox(currentWindow, { 
                type: 'warning',
                buttons: ['Yes', 'No'],
                defaultId: 0,
                cancelId: -1,
                title: 'Workflow modified',
                message: 'Do you want to save changes to the current workflow?'
            });

            if (response == -1) {
                return false;
            } else if (response == 0) {
                this.designerState.saveWorkflow();
            }
        }

        return true
    }

    public render() {
        let classes = this.props.classes || {};
        return <div className={classes.editorContainer}>
            <EditorBar
                uiState={this.designerState.uiState}
                modeChanged={yaml => this.setMode(yaml)}
                openWorkflow={(workflow) => this.designerState.openWorkflow(workflow)}
                newWorkflow={() => this.designerState.newWorkflow()}
                save={() => this.designerState.saveWorkflow()}
                dirty={this.designerState.dirty} />
            {this.designerState.uiState.yamlError && 
                <div className={classes.errAlert}>
                    An error occured while parsing the yaml content. Please review your workflow file.
                </div>}
            <div className={classes.editorBody}>
                {!this.designerState.uiState.yaml &&
                    <WorkflowEditor state={this.designerState.editorState} workflow={this.designerState.editorState.workflow} />}
                {this.designerState.uiState.yaml &&
                    <CodeMirror
                        className={classes.editor}
                        value={this.designerState.yaml}
                        onBeforeChange={(_: any, __: any, yaml: string) => this.designerState.updateYaml(yaml, true)}
                        options={{ lineNumbers: true, mode: 'yaml', theme: 'elegant', indentWithTabs: false, tabSize: 2 }} />}
            </div>
        </div >;
    }
}

export function render() {
    let theme = {};
    ReactDOM.render(
        <JssProvider jss={jss}>
            <ThemeProvider theme={theme}>
                <DesignerScreen />
            </ThemeProvider>
        </JssProvider>, document.getElementById('app'));
}
