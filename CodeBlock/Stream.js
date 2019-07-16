import React, { Component } from 'react';
import { fixConsole, autoLinkUrls } from '../../../../libs/nbUtils'
import { Icon } from "semantic-ui-react"

export default class Stream extends Component {
  render() {
    const { data, isCollapsed } = this.props;
    const contentString = data.content.text;
    const ansiHTML = autoLinkUrls(fixConsole(contentString));
    return (
      <pre contentEditable={false} className={`code-result ${isCollapsed ? ' collapsed' : ''}`}>
        <div dangerouslySetInnerHTML={{ __html: ansiHTML }} />
      </pre>
    );
  }
}

