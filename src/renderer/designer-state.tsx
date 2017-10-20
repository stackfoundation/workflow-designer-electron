import * as fs from 'fs';
var electron = require('electron');

import { action, autorun, observable } from 'mobx';
import * as React from 'react';

import { EditorState } from '../../../../common/workflow-tools/workflow-editor/src/models/state';
import { CatalogImage } from '../../../../common/workflow-tools/workflow-editor/src/models/catalog';
import { Workflow, WorkflowStepSimple } from '../../../../common/workflow-tools/workflow-editor/src/models/workflow';
import { WorkflowService } from '../../../../common/workflow-tools/workflow-editor/src/services/workflow_service';
import { saveWorkflow, loadWorkflow } from '../../../../common/workflow-tools/workflow-loader/workflow-loader';
import { StepCodeEditor } from './step-code-editor';

const scriptEditorFactory = (step: WorkflowStepSimple, fieldName: string) =>
    <StepCodeEditor step={step} fieldName={fieldName} />;
const externalBrowserLinkFactory = (link: string, text: string) =>
    <a href="#" onClick={_ => electron.shell.openExternal('https://stack.foundation/#!' + link)} > {text} </a>;

export class DesignerState {
    private catalog: CatalogImage[];
    @observable public dirty: boolean = false;
    private dispose: any;
    @observable public editorState: EditorState;
    private originalYaml: string = '';
    private workflowPath: string;
    @observable public yamlMode: boolean = false;
    @observable public yaml: string = '';

    constructor() {
        let state = new EditorState();

        new WorkflowService().getWorkflowImagesCatalog()
            .then(response => {
                this.catalog = response;
                state.catalog = this.catalog;
            });

        state.workflow = new Workflow({});
        state.ide = false;
        state.allowCalls = true;

        state.scriptEditorFactory = scriptEditorFactory;
        state.sfLinkFactory = externalBrowserLinkFactory;

        state.selectInitialStep();

        this.editorState = state;

        this.resetDirtyCheck();
    }

    @action
    private setDirty(dirty: boolean) {
        this.dirty = dirty;
    }

    private resetDirtyCheck() {
        if (this.dispose) {
            this.dispose();
        }

        this.originalYaml = this.yaml;
        this.setDirty(false);
        this.dispose = autorun(() => {
            if (!this.dirty) {
                if (this.workflowToYaml() !== this.originalYaml) {
                    this.setDirty(true);
                }
            }
        });
    }

    private updateWorkflow(yaml: string) {
        let workflow = loadWorkflow(yaml);

        this.editorState.workflow = Workflow.apply(workflow as Workflow);
        this.editorState.selectInitialStep();

        this.yaml = this.workflowToYaml();
    }

    private workflowToYaml() {
        return saveWorkflow(this.editorState.workflow.toJS());
    }

    public saveWorkflow() {
        if (this.workflowPath && this.workflowPath.length > 0) {
            if (this.yamlMode) {
                fs.writeFileSync(this.workflowPath, this.yaml);
            } else {
                this.yaml = this.workflowToYaml();
                fs.writeFileSync(this.workflowPath, this.yaml);
            }

            this.resetDirtyCheck();
        }
    }

    @action
    public updateYaml(yaml: string) {
        this.yaml = yaml;
    }

    @action
    public setMode(yamlMode: boolean) {
        if (yamlMode) {
            this.yaml = this.workflowToYaml();
        } else {
            this.updateWorkflow(this.yaml);
        }

        this.yamlMode = yamlMode;
        this.editorState.catalog = this.catalog;
    }

    @action
    public openWorkflow(workflowPath: string) {
        this.workflowPath = workflowPath;

        let buffer = fs.readFileSync(workflowPath);
        if (buffer) {
            this.updateWorkflow(buffer.toString());
            this.editorState.catalog = this.catalog;

            this.resetDirtyCheck();
        }
    }
}
