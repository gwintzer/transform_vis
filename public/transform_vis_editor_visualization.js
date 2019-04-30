import React, { Component } from 'react';
import 'brace/theme/textmate';
import 'brace/mode/json';
import 'brace/mode/javascript';
import 'brace/mode/html';
import 'brace/mode/handlebars';
import {
  EuiTabs,
  EuiTab,
  EuiCodeEditor,
} from '@elastic/eui';

class TransformVisEditor extends Component {

  constructor(props) {
    super(props)

    this.tabs = [
      {
        id: 'dsl',
        name: 'Multi Query DSL',
        mode: 'json',
        param: 'multiquerydsl',
      },
      {
        id: 'js',
        name: 'Javascript',
        mode: 'javascript',
        param: 'meta',
      },
      {
        id: 'template',
        name: 'Template',
        mode: 'handlebars',
        param: 'formula',
      }
    ]

    this.state = {
      selectedTabId: 'dsl',
    };
  }

  componentDidMount() {
    this.props.scope.visualizeEditor.$$element.find('vis-editor-vis-options').css('height', '100%')
  }

  onSelectedTabChanged = id => {
    this.setState({
      selectedTabId: id,
    });
  }

  render() {
    return (
      <div>
        <EuiTabs>
          {this.tabs.map((tab, index) =>
            <EuiTab
              onClick={() => this.onSelectedTabChanged(tab.id)}
              isSelected={tab.id === this.state.selectedTabId}
              key={index}
            >
              {tab.name}
            </EuiTab>
          )}
        </EuiTabs>
        {this.tabs.map((tab, index) =>
          <div key={index} style={{display:(tab.id === this.state.selectedTabId ? 'block' : 'none')}}>
            <EuiCodeEditor
              mode={tab.mode}
              theme="textmate"
              onChange={value => this.props.stageEditorParams({ ...this.props.editorState.params, [tab.param]: value })}
              setOptions={{
                minLines: 40,
                maxLines: 40,
              }}
              value={this.props.editorState.params[tab.param]}
              width={'1017'}
            />
          </div>
        )}
      </div>
    )
  }
}

export default TransformVisEditor