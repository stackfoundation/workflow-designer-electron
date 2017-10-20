import * as fs from 'fs';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStrict, observable } from 'mobx';
import { observer } from 'mobx-react';
let injectSheet = require('@tiagoroldao/react-jss').default;

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/elegant.css';

let jss: any = require('@tiagoroldao/react-jss').jss,
    JssProvider: any = require('@tiagoroldao/react-jss').JssProvider,
    ThemeProvider: any = require('@tiagoroldao/react-jss').ThemeProvider,
    jssComposer: any = require('jss-compose').default,
    jssNested: any = require('jss-nested').default;

import 'purecss/build/pure.css';
import 'purecss/build/grids-responsive.css';
import './less/website.less';

import { CustomInputIO } from '../../../../common/workflow-tools/workflow-editor/src/models/custom-input';
import { WorkflowEditor } from '../../../../common/workflow-tools/workflow-editor/src/components/workflow-editor';
import { EditorBar } from './editor-bar';
import { DesignerState } from './designer-state';

import 'codemirror/mode/yaml/yaml';
import {Controlled as CodeMirror} from 'react-codemirror2';

var electron = require('electron');

jss.use(jssComposer());
jss.use(jssNested());

const styles = (theme: any) => ({
    editorContainer: {
    },
    editorBody: {
        padding: '70px 0 0 0',
    },
    editor: {
        composes: 'editor',
        fontFamily: 'Courier New',
        fontSize: '16px'
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

    private setMode(yamlMode: boolean) {
        this.designerState.setMode(yamlMode);
    }

    private openWorkflow(workflow: string) {
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
                return;
            } else if (response == 0) {
                this.designerState.saveWorkflow();
            }
        }

        this.designerState.openWorkflow(workflow);
    }

    public render() {
        let classes = this.props.classes || {};
        return <div className={classes.editorContainer}>
            <EditorBar
                modeChanged={yaml => this.setMode(yaml)}
                workflowOpened={workflow => this.openWorkflow(workflow)}
                save={() => this.designerState.saveWorkflow()}
                dirty={this.designerState.dirty} />
            <div className={classes.editorBody}>
                {!this.designerState.yamlMode &&
                    <WorkflowEditor state={this.designerState.editorState} workflow={this.designerState.editorState.workflow} />}
                {this.designerState.yamlMode &&
                    <CodeMirror
                        className={classes.editor}
                        value={this.designerState.yaml}
                        onBeforeChange={(_, __, yaml: string) => this.designerState.updateYaml(yaml)}
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
