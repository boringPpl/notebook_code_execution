import React, { Component } from 'react'
import isEmpty from 'lodash/isEmpty'
import {fixConsole, autoLinkUrls} from '../../../../libs/nbUtils'
import { Icon } from "semantic-ui-react"

export default class DisplayData extends Component {
  renderPlainText = (text) => {
    const ansiHTML = autoLinkUrls(fixConsole(text));
    return (
      <pre contentEditable={false} className={`code-result`}>
        <div dangerouslySetInnerHTML={{__html: ansiHTML}} />
      </pre>
    );
  };

  render () {
    const {data, isCollapsed} = this.props;
    if (isEmpty(data)) return null;
    let hasData = false;

    return <React.Fragment>
      {Object.keys(data).map(d => {
        const item = data[d];
        if (!item.content) return null;
        hasData = true;
        return <div contentEditable={false} className={`code-result c ${isCollapsed ? ' collapsed' : ''}`}>
          {item.content.data['image/png'] && <img
            src={'data:image/jpeg;base64,' + item.content.data['image/png']} alt={item.content.data['text/plain']} />}
          {!!item.content.data['text/html'] && <div
            className='result-html' contentEditable={false}
            dangerouslySetInnerHTML={{ __html: item.content.data['text/html'] }} />}
          {item.content.data['text/plain'] && !item.content.data['text/html'] &&
            <div>{item.content.data['text/plain']}</div>}
        </div>
      })}
      {!hasData && data.content && <div contentEditable={false} className={`code-result ${isCollapsed ? ' collapsed' : ''}`}>
        {data.content.data['image/png'] &&
          <img src={'data:image/jpeg;base64,' + data.content.data['image/png']} alt={data.content.data['text/plain']} />}
        {!!data.content.data['text/html'] && <div
          className='result-html' contentEditable={false}
          dangerouslySetInnerHTML={{ __html: data.content.data['text/html'] }} />}
        {data.content.data['text/plain'] && !data.content.data['text/html'] &&
        <div>{this.renderPlainText(data.content.data['text/plain'])}</div>}
      </div>}
    </React.Fragment>
  }
}

