import React, {Component} from 'react';
import { Icon } from "semantic-ui-react"
import {autoLinkUrls, fixConsole} from "../../../../libs/nbUtils"

export default class ExecuteResult extends Component {
  renderPlainText = (text) => {
    const ansiHTML = autoLinkUrls(fixConsole(text));
    const {isCollapsed} = this.props;
    return (
      <pre contentEditable={false} className={`code-result ${isCollapsed ? ' collapsed' : ''}`}>
        <div dangerouslySetInnerHTML={{__html: ansiHTML}} />
      </pre>
    );
  };
  render() {
    const {msg, data, isCollapsed} = this.props;
    if (msg !== data.parent_header.msg_id) return null;
    if(!data.content.data['text/html'] && !data.content.data['image/png']) return this.renderPlainText(data.content.data['text/plain']);
    return (
      <div contentEditable={false} className={`code-result ${isCollapsed ? ' collapsed' : ''}`}>
        {data.content.data['image/png'] && <img src={'data:image/jpeg;base64,' + data.content.data['image/png']} alt={data.content.data['text/plain']} />}
        {!!data.content.data['text/html'] && !data.content.data['image/png'] && <div className='result-html' contentEditable={false} dangerouslySetInnerHTML={{__html: data.content.data['text/html']}} />}
      </div>
    );
  }
}

