import React from 'react';
import PropTypes from 'prop-types';

class OnMount extends React.Component {
  componentDidMount() {
    this.props.onMount();
  }
  componentDidUpdate() {
    this.props.onUpdate();
  }
  render() {
    return <div ref={this.props.forwardedRef} dangerouslySetInnerHTML={this.props.dangerouslySetInnerHTML}></div>
  }
}
OnMount.propTypes = {
  onMount: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  dangerouslySetInnerHTML: PropTypes.object,
};
export default React.forwardRef((props, ref) => {
  return <OnMount {...props} forwardedRef={ref} />;
});