/* eslint-disable no-unused-vars */
import React, {Component} from 'react'
import {Button} from 'semantic-ui-react'
import {removeTestCase, updateTestCase} from "../../../../actions/editor";
import {toast} from 'react-toastify'
import TestCaseResult from "./TestCaseResult";
import brace from 'brace';
import 'brace/mode/python'
import 'brace/snippets/python'
import 'brace/ext/searchbox'
import 'brace/ext/language_tools'
import 'brace/theme/textmate'



import AceEditor from 'react-ace';
import isEqual from "fast-deep-equal";

export default class TestCase extends Component {
  state = {
    collapsed: false,
    showDialogue: false,
    lastName: '',
    lastCode: '',
    code: '',
    loaded: false
  };

  componentDidMount() {
    const {data: {name, code}} = this.props;
    this.setState({lastName: name, lastCode: code, code}, () => this.setState({loaded: true}));
    this.saveInterval = setInterval(this.save, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.saveInterval)
  }

  save = () => {
    const {data: {name, id}} = this.props;
    const {lastCode, lastName, code} = this.state;
    if (name !== lastName || code !== lastCode) {
      this.setState({lastCode: code, lastName: name});
      updateTestCase({id, record: {name, code}}).then(res => this.refs.code.editor.focus())
    }
  };


  remove = () => {
    const {data: {id}, onRemove} = this.props;
    removeTestCase({id}).then(res => {
      if (res.errors) return toast.error('Remove test case failed');
      else onRemove && onRemove()
    })
  };

  onChange = code => {
    const {onCodeChange} = this.props;
    this.setState({code}, () => onCodeChange(code))
  };

  render() {
    const {data: {result}} = this.props;
    const {collapsed, code} = this.state;
    return (
      <div className={`test-case${collapsed ? ' collapsed' : ''}`} contentEditable={false}>
        <div className='title clearfix'>
          <b>Test case </b>
          <div className='controls'>
            {!collapsed && <Button icon='angle up' onClick={() => this.setState({collapsed: true})} />}
            {collapsed && <Button icon='angle down' onClick={() => this.setState({collapsed: false})} />}
            <Button icon='trash' onClick={this.remove} />
          </div>
        </div>
        <div className={`content`}>
          <div style={{padding: 10}}>
            <AceEditor
              ref="code"
              mode="python"
              name="blah2"
              width="100%"
              theme='textmate'
              maxLines={Infinity}
              onChange={this.onChange}
              fontSize={14}
              showPrintMargin={false}
              showGutter={false}
              highlightActiveLine={false}
              value={code}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: false,
                tabSize: 2,
              }} />
          </div>

        </div>
        {result && <TestCaseResult result={result} />}
      </div>
    )
  }
}

