import React, {Component} from 'react';

export default class Execute extends Component {
  execute = data => {
    const {session, messages} = this.state;
    const {socket} = this.props;
    let {waitingList, pendingBlocks} = this.props.kernelStatus;
    const {code, msg_id, blockID} = data;
    waitingList = waitingList.filter(w => w.msg_id !== msg_id);
    messages[msg_id] = blockID;
    pendingBlocks.push(blockID);
    this.changeKernelStatus({waitingList, pendingBlocks});
    this.setWaitingList(waitingList);
    const msg = {
      header: {
        username: '',
        version: '5.2',
        session,
        msg_id,
        msg_type: 'execute_request'
      },
      parent_header: {},
      channel: 'shell',
      content: {
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: true,
        stop_on_error: true,
        code
      },
      metadata: {},
      buffers: []
    };
    this.currentEditor.change(c => {
      const {document} = c.value;
      const currentNode = document.getNode(blockID);
      if (!currentNode) return;
      const data = currentNode.data.toJS();
      data.result = {};
      c.setNodeByKey(blockID, {data})
    });

    console.log('execute', data);
    socket.send(JSON.stringify(msg))
  };

  render() {
    return <div />
  }
}