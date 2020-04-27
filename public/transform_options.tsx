import React, { useCallback, useRef } from 'react';
// @ts-ignore EuiCodeEditor
import { EuiPanel, EuiCodeEditor } from '@elastic/eui';
import 'brace/theme/textmate';
import 'brace/mode/json';
import 'brace/mode/javascript';
import 'brace/mode/handlebars';
import 'brace/snippets/json';
import 'brace/snippets/javascript';
import 'brace/snippets/handlebars';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';

import ReactResizeDetector from 'react-resize-detector';
import { VisOptionsProps } from 'ui/vis/editors/default';
import { TransformVisParams, TransformVisParamsNames } from './types';

const mode: Record<string, string> = {
  multiquerydsl: 'json',
  meta: 'javascript',
  formula: 'handlebars',
};

function getTransformOptions(param: TransformVisParamsNames) {
  return function TransformOptions({ stateParams, setValue }: VisOptionsProps<TransformVisParams>) {
    const onChange = useCallback((value: any) => setValue(param, value), [setValue]);

    const codeEditor = useRef<EuiCodeEditor>(null);
    const onResize = useCallback(() => {
      const current = codeEditor.current;
      if (current !== null) {
        current.aceEditor.editor.resize();
      }
    }, [codeEditor]);

    return (
      <EuiPanel paddingSize="s">
        <EuiCodeEditor
          ref={codeEditor}
          id="transformVisInput"
          key={param}
          mode={mode[param]}
          theme="textmate"
          className="visEditor--transform__textarea"
          value={stateParams[param]}
          onChange={onChange}
          fullWidth={true}
          data-test-subj="transformCodeeditor"
          width="100%"
          height="100%"
          setOptions={{
            useSoftTabs: true,
            tabSize: 2,
            fontSize: '14px',
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
          }}
          minLines={6}
        />
        <ReactResizeDetector handleWidth handleHeight onResize={onResize} />
      </EuiPanel>
    );
  };
}

export { getTransformOptions };
