import React from 'react';
import PropTypes from 'prop-types';
import stylePropType from 'react-style-proptype';

class Pane extends React.PureComponent {
  _ref = React.createRef();

  _currentSize = 0;

  _args = [];

  _requestAnimationFrame = null;

  _isMount = false;

  componentDidMount() {
    if (this.props.eleRef) {
      this.props.eleRef(this._ref.current);
    }
  }

  updateSize(size, prop) {
    if (this._ref.current) {
      //
      if (this._isMount) {
        if (this._args.length) {
          this._args[1] = size;
          this._args[3] = prop;
        } else {
          this._args = [this._currentSize, size, 0, prop];
        }
        //
        this.requestAnimate();
      } else {
        this._isMount = true;
        this._ref.current.style[prop] = `${size}px`;
        this._currentSize = size;
      }
    }
  }

  sineEaseOut(t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  }

  requestAnimate() {
    const [start, end, step, prop] = this._args;
    const { endStep } = this.props;
    //
    if (this._requestAnimationFrame) {
      window.cancelAnimationFrame(this._requestAnimationFrame);
      this._requestAnimationFrame = null;
    }
    //
    this._requestAnimationFrame = window.requestAnimationFrame(() => {
      const diff = end - start;
      const next = this.sineEaseOut(step, start, diff, endStep);

      if (step < endStep && Math.abs(diff) > 1) {
        this._ref.current.style[prop] = `${next}px`;
        this._currentSize = next;
        this._args = [next, end, step + 1, prop];
        this.requestAnimate();
      } else {
        this._ref.current.style[prop] = `${end}px`;
        this._currentSize = end;
        this._args[2] = 0;
      }
    });
  }

  render() {
    const {
      children,
      className,
      split,
      style: styleProps,
      size,
    } = this.props;

    const classes = ['Pane', split, className];

    let style = {
      flex: 1,
      position: 'relative',
      outline: 'none',
    };

    if (size !== undefined) {
      if (split === 'vertical') {
        this.updateSize(size, 'width');
      } else {
        this.updateSize(size, 'height');
        style.display = 'flex';
      }
      style.flex = 'none';
    }

    style = Object.assign({}, style, styleProps || {});

    return (
      <div ref={this._ref} className={classes.join(' ')} style={style}>
        {children}
      </div>
    );
  }
}

Pane.propTypes = {
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  split: PropTypes.oneOf(['vertical', 'horizontal']),
  style: stylePropType,
  eleRef: PropTypes.func,
  endStep: PropTypes.number,
};

Pane.defaultProps = {
  endStep: 30,
};

export default Pane;
