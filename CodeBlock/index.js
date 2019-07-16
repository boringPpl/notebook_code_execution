import React, {Component} from "react";
import CodeBlockResult from "./CodeBlockResult";
import Loading from "./Loading";
import {connect} from "react-redux";
import {Icon, Loader, Menu, Popup, Transition} from "semantic-ui-react";
import {findDOMNode} from "react-dom";
import uuid from "uuid";
import TestCase from "./TestCase";
import {createTestCase} from "../../../../actions/editor";
import {withRouter} from "react-router-dom";
import get from "lodash/get";
import {SubscriptionClient} from "subscriptions-transport-ws";
import config from "../../../../config";
import {headers} from "../../common/EditorImportRules";
import moment from "moment";
import showIcon from '../../../../assets/notebook-images/show_icon.png'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'fast-deep-equal'
import Languages from '../../utils/getLanguages'

@connect(state => ({
  kernelStatus: state.kernel,
  me: state.profile.me,
  results: state.kernel.output
}))
@withRouter
export default class CodeBlock extends Component {
  state = {
    isCollapsed: false,
    showMenu: false,
    clientX: 0,
    clientY: 0,
    testCases: [],
    testing: false,
    isHover: false
  };

  componentDidMount() {
    const {testCases = []} = this.props;
    this.setState({testCases});
  }

  onChange = syntax => {
    const {node, editor, onChange} = this.props;
    editor.change(c => c.setNodeByKey(node.key, {data: node.data.merge({syntax})}));
    this.setState({showMenu: false});
    onChange(syntax);
  };

  handleEditableChange = (e, {checked}) => {
    const {node, editor} = this.props;
    const data = node.data.toJS();
    if (!data.nodeId) data.nodeId = uuid.v4();
    data.playground = checked;
    editor.change(c => c.setNodeByKey(node.key, {data: node.data.merge(data)}));
  };

  showMenu = e => {
    const syntaxButton = this.refs.syntax;
    const syntaxDOM = findDOMNode(syntaxButton).getBoundingClientRect();
    this.setState({
      showMenu: true,
      clientX: syntaxDOM.right,
      clientY: syntaxDOM.top
    });
  };
  hideMenu = () => this.setState({showMenu: false});

  addTestCase = () => {
    const {testCases} = this.state;
    const {
      node,
      editor,
      match: {
        params: {topicId}
      }
    } = this.props;
    const data = node.data.toJS();
    let cellId = data.nodeId;
    if (!cellId) {
      cellId = uuid.v4();
      data.nodeId = cellId;
      editor.change(c => c.setNodeByKey(node.key, {data: node.data.merge(data)}));
    }
    createTestCase({
      record: {topicId, cellId, name: "Untitled test case", code: " "}
    }).then(res => {
      const test = get(res, "data.testcaseCreate");
      if (test) {
        testCases.push(test);
        this.setState(testCases);
      }
    });
  };

  _handleCodeChange = (code, index) => {
    const {testCases} = this.state;
    testCases[index].code = code;
    this.setState({testCases});
  };


  _handleRemove = index => {
    const {testCases} = this.state;
    testCases.splice(index, 1);
    this.setState({testCases});
  };

  runTestCase = () => {
    this.setState({testing: true});
    const {
      kernelStatus: {socketUrl},
      node,
      match: {
        params: {topicId}
      }
    } = this.props;
    const cellId = node.data.get("nodeId");
    const code = node
      .getTexts()
      .map(t => t.text)
      .join("\n");
    const variables = {record: {wsUrl: socketUrl.split('?')[0], topicId, cellId, code}};
    const {testCases} = this.state;
    const mewTest = testCases.map(test => ({...test, result: null}));
    this.setState({testCases: mewTest});
    this.wsClient = new SubscriptionClient(config.CONTENTKIT_APOLLO_WS_API, {
      reconnect: true,
      connectionParams: headers
    });

    this.wsClient
      .request({
        query: `
        subscription($record: TestcaseRunInputType!){
          testcaseRun(record: $record){
            type
            executionTime
            status
            name
            id
            traceback
            exceptionName
        }
      }`,
        variables
      })
      .subscribe({
        next: result => {
          const type = get(result, "data.testcaseRun.type");
          switch (type) {
            case "COMPLETED":
              this.wsClient.close(true);
              this.setState({testing: false});
              return;

            case "TESTCASE":
              const res = get(result, "data.testcaseRun");
              const {testCases} = this.state;
              const newTest = testCases.map(test => {
                if (test.id === res.id) test.result = res;
                return test;
              });
              this.setState({testCases: newTest});
              return;
            default:
              return null;
          }
        }
      });
  };

  handleSubmit = value => {
    const {editor, node, onSubmit} = this.props;
    editor.change(change => {
      let data = node.data.toJS();
      data.result.input_request = null;
      change.setNodeByKey(node.key, {data: node.data.merge(data)});
    });
    onSubmit(value);
  };

  onMouseOver = () => {
    this.setState({isHover: true});
  };

  onMouseOut = () => {
    this.setState({isHover: false});
  };

  onPlayClick = () => {
    const {node, triggerCodeRun} = this.props;
    triggerCodeRun(node);
  };

  showCode = e => this.setBlock(e, {hideCode: false});
  hideCode = e => this.setBlock(e, {hideCode: true});
  showResult = e => this.setBlock(e, {hideResult: false});
  hideResult = e => this.setBlock(e, {hideResult: true});

  setBlock = (e, data) => {
    e.stopPropagation();
    e.preventDefault();
    const {editor, node} = this.props;
    editor.change(c => c.setNodeByKey(node.key, {data: node.data.merge(data)}))
  };

  renderTestCase = () => {
    const {testCases} = this.state;
    const {node} = this.props;
    let {playground} = node.data.toJS();
    return testCases && !!testCases.length &&
      playground &&
      testCases.map((testCase, index) => <TestCase
        data={testCase}
        key={index}
        onCodeChange={value => this._handleCodeChange(value, index)}
        onRemove={() => this._handleRemove(index)}
        onNameChange={(e, {value}) => this._handleNameChange(value, index)}
      />)
  };


  renderCode = () => {
    const {showMenu, clientX, clientY, testCases, testing, isHover} = this.state;
    const {attributes, children, node, kernelStatus, onStop, results} = this.props;
    const {socketUrl, pendingBlocks, id, waitingList} = kernelStatus;
    const {syntax, msg_id, playground, hideCode} = node.data.toJS();
    const isWaiting = waitingList.filter(waiting => waiting.blockID === node.key).length > 0;
    const isPending = pendingBlocks.indexOf(node.key) !== -1 || (msg_id === kernelStatus.msg_id && kernelStatus.status !== 'idle');
    const result = results[msg_id] || {};

    if (!result) return null;

    if (hideCode) return <div className='hide_code_msg' contentEditable={false} style={{color: '#919DB0'}}>
      <span><a href='#' onClick={this.showCode}>Expand</a>... code is hidden.</span>
      <a href='#' onClick={this.showCode} className='expand_icon'><img alt='' src={showIcon}/></a>
      <span style={{display: 'none'}}>{children}</span>
    </div>;

    return <div className="code-wrapper">
      {!(isPending || isWaiting) && !isHover && (
        <div className="code-order" contentEditable={false}>
          [ {get(result, 'execute_reply.kernelId') === id ? get(result, "execute_reply.content.execution_count") : ''} ]
        </div>
      )}
      {(isPending || isWaiting) && (
        <div className="code-order">
            <span>
              <Loader size="small" active inline/>
            </span>
          &nbsp;
        </div>
      )}
      {isHover && !(isPending || isWaiting) &&
      <div className="play-button" contentEditable={false} onClick={() => this.onPlayClick()}>
        <Popup
          trigger={<Icon className="small-icon" name="play"/>}
          position="top center"
          inverted
          content={
            <div style={{width: "max-content"}}>
              {result && result.execute_reply
                ? `Executed in ${new Date(
                  result.execute_reply.header.date
                ) -
                new Date(
                  result.execute_reply.metadata.started
                )}ms, finished ${moment(
                  result.execute_reply.header.date
                ).format("h:m:s YYYY-MM-DD")}`
                : "Has not been executed"}
            </div>
          }
        />
      </div>
      }
      <div
        className={`code-block${result ? " has-result" : ""}${playground ? " playground" : ""}`} spellCheck="false">
        <div style={{position: "relative"}}>
          <div className="show-hide-code code_block_controls" onClick={this.hideCode} contentEditable={false}>
            <span className='syntax'>Hide</span>
          </div>
          <pre {...attributes}>{children}</pre>

          <div className="code_block_controls" contentEditable={false}>
            {!testing &&
            socketUrl &&
            syntax === "python" &&
            testCases &&
            !!testCases.length &&
            playground && (
              <span className={`syntax run-test-case`} onClick={this.runTestCase}>
                    {/*<Icon name="tasks" />*/}
                Submit code
                  </span>
            )}
            {testing && (
              <span className={`syntax`} onClick={this.runTestCase}>
                  <Icon name="ellipsis horizontal"/>
                  Testing...
                </span>
            )}

            {syntax === "python" &&
            (!testCases || !testCases.length) &&
            playground && (
              <span className={`syntax`} onClick={this.addTestCase}>
                    <Icon name="plus"/>
                    Add test case
                  </span>
            )}
            <span
              ref="syntax"
              className={`syntax${showMenu ? " active" : ""}`}
              onClick={this.showMenu}
            >
                {Languages[syntax]} <Icon name="angle down"/>
              </span>
          </div>
        </div>
        {this.renderTestCase()}

        {kernelStatus.msg_id === msg_id && kernelStatus.status === "busy" && (
          <Loading onStop={onStop}/>
        )}
      </div>


      {showMenu && <div className="overlay" onClick={this.hideMenu}/>}
      <div className="syntax-menu">
        <Transition visible={showMenu} animation="scale" duration={100}>
          <Menu
            size="tiny"
            vertical>
            {Object.keys(Languages).map(syntax => (
              <Menu.Item key={syntax} onClick={() => this.onChange(syntax)}>
                {Languages[syntax]}
              </Menu.Item>
            ))}
          </Menu>
        </Transition>
      </div>
    </div>
  };

  componentDidUpdate(prevProps, prevState) {
    const {node, results} = this.props;
    let {msg_id} = node.data.toJS();
    const result = results[msg_id] || {};
    const oldResult = prevProps.results[msg_id] || {};
    if (isEqual(result, oldResult)) return;
    clearTimeout(this.hiddenTimeOut);
    this.hiddenTimeOut = setTimeout(() => {
      const res = document.getElementById('code_result_' + msg_id);
      if (res) {
        const resText = res.innerText;
        if (resText.length < 20) console.log(msg_id, resText);
        document.getElementById('result_wrapper_' + msg_id).style.display = resText.length === 0 ? 'none' : 'block'
      }
    }, 200)
  }


  renderResult = () => {
    const {node, results} = this.props;
    let {msg_id, playground, hideResult} = node.data.toJS();
    const result = results[msg_id] || {};
    if (isEmpty(result)) return null;
    if (hideResult) return <div className='hide_code_msg' contentEditable={false} style={{color: '#919DB0'}}>
      <span><a href='#' onClick={this.showResult}>Expand</a>... result is hidden.</span>
      <a href='#' onClick={this.showResult} className='expand_icon'><img alt='' src={showIcon}/></a>
    </div>;
    return <div className="code-wrapper" id={'result_wrapper_' + msg_id}>

      <div className={`code-block${result ? " has-result" : ""}${playground ? " playground" : ""}`} spellCheck="false">
        <div className="show-hide-code code_block_controls" onClick={this.hideResult} contentEditable={false}>
          <span className='syntax'>Hide</span>
        </div>
        {result && msg_id && <CodeBlockResult msg_id={msg_id} result={result} onSubmit={this.handleSubmit}/>}
      </div>
    </div>
  };

  render() {
    return <div
      className='code-outer'
      onMouseOver={() => this.onMouseOver()}
      onMouseLeave={() => this.onMouseOut()}>
      {this.renderCode()}
      {this.renderResult()}
    </div>
  }
}
