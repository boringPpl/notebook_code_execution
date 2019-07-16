import React, {Component} from 'react';

export default class Loading extends Component {
  state = {
    timeOut: false
  };
  componentDidMount(){
    setTimeout(() => {
      this.setState({timeOut: true})
    }, 5000)
  }
  handleStop = e => {
    const {onStop} = this.props;
    e.preventDefault();
    e.stopPropagation();
    onStop && onStop()

  };
  render() {
    const {timeOut} = this.state;
    return (
      <div contentEditable={false} className='execute-time clearfix loading'>
       Please wait. Code is executing...
        {timeOut && <span>Is it taking too long? <a href='#' onClick={this.handleStop}>Click here to stop</a> </span>}
      </div>
    );
  }
}
