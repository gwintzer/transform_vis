import '@webcomponents/shadydom';
import React from 'react';
// @ts-ignore
import ShadowDOM from 'react-shadow';
// @ts-ignore
import { saveAs } from '@elastic/filesaver';
import OnMount from './on_mount';
import { Vis } from '../../../src/legacy/core_plugins/visualizations/public/np_ready/public';
import { TransformVisData } from './types';

interface TransformVisComponentProps extends TransformVisData {
  renderComplete: () => {};
  vis: Vis;
}

interface TransformVisWrapperProps {
  vis: Vis;
  visData: TransformVisData;
  renderComplete: () => {};
}

/**
 * The TransformVisComponent renders transform to HTML and presents it.
 */
class TransformVisComponent extends React.Component<TransformVisComponentProps> {
  private transformVis = React.createRef<HTMLDivElement>();

  constructor(props: TransformVisComponentProps) {
    super(props);
    this.afterRender = this.afterRender.bind(this);
  }

  async afterRender() {
    if (
      this.props.meta &&
      typeof this.props.meta.after_render === 'function' &&
      this.transformVis.current &&
      this.transformVis.current.parentNode &&
      this.transformVis.current.parentNode instanceof ShadowRoot
    ) {
      const root: ShadowRoot = this.transformVis.current.parentNode;
      try {
        await this.props.meta.after_render.bind({
          el: root.host.parentNode,
          container: root.host,
          root,
          vis: this.props.vis,
          es: this.props.es,
          context: this.props.context,
          timeRange: this.props.timeRange,
          timefilter: this.props.timefilter,
          meta: this.props.meta,
          saveAs,
        })();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Error executing after_render for '${(this.props.vis || {}).title}':`, err);
      }
    }
    this.props.renderComplete();
  }

  /**
   * Render the actual HTML.
   */
  render() {
    return (
      <ShadowDOM>
        <div className="output-vis">
          <OnMount
            ref={this.transformVis}
            onMount={this.afterRender}
            onUpdate={this.afterRender}
            dangerouslySetInnerHTML={{ __html: this.props.transform }}
          />
        </div>
      </ShadowDOM>
    );
  }
}

/**
 * This is a wrapper component, that is actually used as the visualization.
 * The sole purpose of this component is to extract all required parameters from
 * the properties and pass them down as separate properties to the actual component.
 * That way the actual (TransformVisComponent) will properly trigger it's prop update
 * callback (componentWillReceiveProps) if one of these params change. It wouldn't
 * trigger otherwise (e.g. it doesn't for this wrapper), since it only triggers
 * if the reference to the prop changes (in this case the reference to vis).
 *
 * The way React works, this wrapper nearly brings no overhead, but allows us
 * to use proper lifecycle methods in the actual component.
 */
export function TransformVisWrapper(props: TransformVisWrapperProps) {
  return (
    <TransformVisComponent
      vis={props.vis}
      renderComplete={props.renderComplete}
      {...props.visData}
    />
  );
}
