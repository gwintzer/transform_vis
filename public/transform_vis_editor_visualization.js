import React, { Component } from 'react';
import 'brace/theme/textmate';
import 'brace/mode/json';
import 'brace/mode/javascript';
import 'brace/mode/html';
import 'brace/mode/handlebars';
import {
  EuiTabbedContent,
  EuiCodeEditor,
} from '@elastic/eui';

class TransformVisEditor extends Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.props.scope.visualizeEditor.$$element.find('vis-editor-vis-options').css('height', '100%')
  }

  render() {
    return (
      <EuiTabbedContent
        className="transform-vis-editor"
        size="s"
        tabs={[
          {
            id: 'dsl',
            name: 'Multi Query DSL',
            content: <EuiCodeEditor
              mode="json"
              theme="textmate"
              onChange={multiquerydsl => this.props.stageEditorParams({ ...this.props.editorState.params, multiquerydsl })}
              setOptions={{
                minLines: 40,
                maxLines: 40,
              }}
              value={this.props.editorState.params.multiquerydsl}
              width={'1017'}
            />
          },
          {
            id: 'js',
            name: 'Javascript',
            content: <EuiCodeEditor
              mode="javascript"
              theme="textmate"
              onChange={meta => this.props.stageEditorParams({ ...this.props.editorState.params, meta })}
              setOptions={{
                minLines: 40,
                maxLines: 40,
              }}
              value={this.props.editorState.params.meta}
              width={'1017'}
            />
          },
          {
            id: 'template',
            name: 'Template',
            content: <EuiCodeEditor
              mode="handlebars"
              theme="textmate"
              onChange={formula => this.props.stageEditorParams({ ...this.props.editorState.params, formula })}
              setOptions={{
                minLines: 40,
                maxLines: 40,
              }}
              value={this.props.editorState.params.formula}
              width={'1017'}
            />
          }
        ]}
      />
    )
  }
}

export default TransformVisEditor