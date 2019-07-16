import React, {Component} from 'react';
import {fixConsole} from '../../../../libs/nbUtils'
import { Icon } from "semantic-ui-react"

export default class Error extends Component {
  render() {
    const {msg, data, isCollapsed} = this.props;
    if (msg !== data.parent_header.msg_id) return null;
    const errorString = data.content.traceback.join('\n');
    const ansiHTML = fixConsole(errorString);
    return (
      <pre contentEditable={false} className={`code-result error ${isCollapsed ? 'collapsed' : ''}`}>
        <div dangerouslySetInnerHTML={{__html: ansiHTML}} />
      </pre>
    );
  }
}

