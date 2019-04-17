import '@webcomponents/shadydom';
import React, { Component } from 'react';
import ShadowDOM from 'react-shadow';
import OnMount from './on_mount';
import { saveAs } from '@elastic/filesaver';

class TransformVisComponent extends Component {

  constructor(props) {
    super(props)
    this.el = React.createRef()
    this.afterRender = this.afterRender.bind(this)
  }

  async afterRender() {
    if (this.props.meta && typeof this.props.meta.after_render === "function") {
      try {
        await this.props.meta.after_render.bind({
          el: this.el.current.parentNode.host.parentNode,
          container: this.el.current.parentNode.host,
          root: this.el.current.parentNode,
          vis: this.props.vis,
          es: this.props.es,
          context: this.props.context,
          meta: this.props.meta,
          saveAs,
        })();
      } catch (err) {
        console.error(`Error executing after_render for '${(this.props.vis||{}).title}':`, err)
      }
    }
    this.props.renderComplete()
  }

  render() {
    return (
      <ShadowDOM>
        <div className="output-vis">
          <OnMount ref={this.el} onMount={this.afterRender} onUpdate={this.afterRender} dangerouslySetInnerHTML={{__html: this.props.html}}></OnMount>
        </div>
      </ShadowDOM>
    )
  }
}

export function TransformVisWrapper(props) {
  return (
    <TransformVisComponent
      vis={props.vis}
      renderComplete={props.renderComplete}
      html={props.visData.html}
      meta={props.visData.meta}
      es={props.visData.es}
      context={props.visData.context}
    />
  );
}