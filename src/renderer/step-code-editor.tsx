import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/pastel-on-dark.css';
let injectSheet = require('react-jss').default;
import {Controlled as CodeMirror} from 'react-codemirror2';
import 'codemirror/mode/shell/shell';

import { WorkflowStepSimple } from '@stackfoundation/workflow-designer/lib/models/workflow';

const styles = (theme: any) => ({
    editor: {
        fontFamily: 'Courier New',
        fontSize: '16px'
    }
});

interface CodeEditorProps {
    step?: WorkflowStepSimple;
    fieldName: string;
    classes?: any;
}

@injectSheet(styles)
@observer
export class StepCodeEditor extends React.Component<CodeEditorProps, {}> {
    constructor(props: CodeEditorProps) {
        super(props);
    }

    @action
    updateCode(newCode: string) {
        (this.props.step as any)[this.props.fieldName] = newCode;
    }

    public render() {
        let classes = this.props.classes || {};
        let script = (this.props.step as any)[this.props.fieldName];
        return (<CodeMirror
            className={classes.editor}
            value={script}
            onBeforeChange={(_: any, __: any, code: string) => this.updateCode(code)}
            options={{ lineNumbers: true, mode: 'shell', theme: 'pastel-on-dark' }} />);
    }
}
