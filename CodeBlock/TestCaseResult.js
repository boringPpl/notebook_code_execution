import React, {Component} from 'react';
import AsToHtml from 'ansi-to-html'
const convert = new AsToHtml();

export default class TestCaseResult extends Component {
  state = {
    firework: true
  };


  componentWillReceiveProps(nextProps) {
    if (nextProps.status === 'ok ') {
      this.setState({firework: true});
      this.fireworkTimeout = setTimeout(() => this.setState({firework: false}), 10000)
    }
  }


  componentDidMount() {
    this.fireworkTimeout = setTimeout(() => this.setState({firework: false}), 10000)
  }

  componentWillUnmount() {
    clearTimeout(this.fireworkTimeout)
  }

  render() {
    const {result: {executionTime, status, traceback, exceptionName}} = this.props;
    const {firework} = this.state;
    const ansiHTML = traceback && traceback.length ? convert.toHtml(traceback.join('\n')) : '';
    return (
      <div className='test-case-result' style={{padding: 10, background: '#f5f5f5'}}>
        <h4 className='result-title'>Test Case result</h4>
        <div className='result'>{status === 'ok'
          ? <span style={{fontWeight: 'bold', fontSize: '20px', color: 'green'}}>PASS</span>
          : <span style={{fontWeight: 'bold', fontSize: '20px', color: 'red'}}>FAILED</span>}</div>
        <div className='result'><b>Execution time: </b>{executionTime || 0} ms</div>
        <div className='result'>{traceback && traceback.length && <div contentEditable={false}>
          <div dangerouslySetInnerHTML={{__html: ansiHTML}} />
        </div>}</div>
        <div className='result'>{exceptionName}</div>
        {status === 'ok' && firework && <div className='pyro'>
          <div className="before" />
          <div className="after" />
        </div>}
      </div>
    );
  }
}

