import React, {Component} from 'react';
import moment from 'moment'
import {Icon} from 'semantic-ui-react'

export default class ExecuteTime extends Component {
  render() {
    const {msg, data, isCollapsed, onCollapseChange} = this.props;
    if (msg !== data.parent_header.msg_id) return null;
    const start = new Date(data.metadata.started);
    const end = new Date(data.header.date);
    const finished = moment(end).format('h:m:s YYYY:MM:DD');
    const time = end - start;
    return (
      <div contentEditable={false} className='execute-time clearfix' onClick={() => onCollapseChange(!isCollapsed)}>
        Executed in {time}ms, finished {finished}
        <div style={{float: 'right'}}>
          {isCollapsed && <Icon name='angle down' />}
          {!isCollapsed && <Icon name='angle up' />}
        </div>
      </div>
    );
  }
}

