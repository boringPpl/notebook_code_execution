import React, {Component, Fragment} from 'react'
import Stream from "./Stream"
import DisplayData from "./DisplayData"
import Error from "./Error"
import ExecuteResult from "./ExecuteResult"
import InputRequest from '../../common/InputRequest'

export default class CodeBlockResult extends Component {
  render() {
    const {result, msg_id, isCollapsed, onSubmit} = this.props;
    const {stream, execute_result, error, display_data, input_request} = result;

    return (
      <div id={'code_result_' + msg_id}>
        {input_request && <InputRequest msg={msg_id} data={input_request} onSubmit={onSubmit}/>}
        {stream && <Stream isCollapsed={isCollapsed} msg={msg_id} data={stream} />}
        {display_data && <DisplayData isCollapsed={isCollapsed} data={display_data} />}
        {error && <Error isCollapsed={isCollapsed} msg={msg_id} data={error} />}
        {execute_result && <ExecuteResult isCollapsed={isCollapsed} msg={msg_id} data={execute_result} />}
      </div>
    );
  }
}
