import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStrict, action } from 'mobx';
let injectSheet = require('@tiagoroldao/react-jss').default;
let PrismCode = require('react-prism').PrismCode;
const Download = require('react-icons/lib/fa/download');
const Loadable = require('react-loadable');

let jss: any = require('@tiagoroldao/react-jss').jss,
JssProvider: any = require('@tiagoroldao/react-jss').JssProvider,
ThemeProvider: any = require('@tiagoroldao/react-jss').ThemeProvider,
jssComposer: any = require('jss-compose').default,
jssNested: any = require('jss-nested').default;

import 'purecss/build/pure.css';
import 'purecss/build/grids-responsive.css';
import './less/website.less';

import { EditorState } from '../../../../common/workflow-tools/workflow-editor/src/models/state';
import { CustomInputIO } from '../../../../common/workflow-tools/workflow-editor/src/models/custom-input';
import { Workflow, WorkflowStepSimple, WorkflowStepCompound } from '../../../../common/workflow-tools/workflow-editor/src/models/workflow';
import { WorkflowEditor } from '../../../../common/workflow-tools/workflow-editor/src/components/workflow-editor';
import { WorkflowService } from '../../../../common/workflow-tools/workflow-editor/src/services/workflow_service';
import { saveWorkflow } from '../../../../common/workflow-tools/workflow-loader/workflow-loader';
import { CodeEditor } from './code-editor';

jss.use(jssComposer());
jss.use(jssNested());

const styles = (theme: any) => ({
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
export class DesignerScreen extends React.Component<{ classes?: any }, { workflow: string }> {
    private editorState: EditorState;

    constructor(props: { classes?: any }) {
        super(props);

        useStrict(true);

        let state = new EditorState();

        state.scriptEditorFactory = (step: WorkflowStepSimple, fieldName: string) =>
            <CodeEditor step={step} fieldName={fieldName} />;

        new WorkflowService().getWorkflowImagesCatalog()
            .then(response => state.setCatalog(response));

        state.workflow = new Workflow({});
        state.ide = false;

        this.editorState = state;
    }

    public render() {
        return <WorkflowEditor state={this.editorState} />;
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