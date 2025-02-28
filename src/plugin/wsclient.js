import WebSocket from 'ws'

import Plugin from './plugin'

/**
 * Status flags
 * @private
 */
const STATUS = {
  IS_NOT_INITIALIZED: -1,
  IS_CONNECTING: 0,
  IS_OPEN: 1,
  IS_CLOSING: 2,
  IS_CLOSED: 3,
}

/**
 * Default options
 * @private
 */
const defaultOptions = {
  host: 'localhost',
  port: 8080,
  secure: false,
  protocol: [],
}

/**
 * OSC plugin for a Websocket client running in node or browser context
 */
export default class WebsocketClientPlugin extends Plugin {
  /**
   * Create an OSC WebsocketClientPlugin instance with given options.
   * Defaults to *localhost:8080* for connecting to a Websocket server
   * @param {object} [options] Custom options
   * @param {string} [options.host='localhost'] Hostname of Websocket server
   * @param {number} [options.port=8080] Port of Websocket server
   * @param {boolean} [options.secure=false] Use wss:// for secure connections
   * @param {string|string[]} [options.protocol=''] Subprotocol of Websocket server
   *
   * @example
   * const plugin = new OSC.WebsocketClientPlugin({ port: 9912 })
   * const osc = new OSC({ plugin: plugin })
   */
  constructor(options) {
    super()

    if (!WebSocket) {
      throw new Error('WebsocketClientPlugin can\'t find a WebSocket class')
    }

    /**
     * @type {object} options
     * @private
     */
    this.options = { ...defaultOptions, ...options }

    /**
     * @type {object} socket
     * @private
     */
    this.socket = null
    /**
     * @type {number} socketStatus
     * @private
     */
    this.socketStatus = STATUS.IS_NOT_INITIALIZED

    /**
     * @type {function} notify
     * @private
     */
    this.notify = () => {}
  }

  /**
   * Internal method to hook into osc library's
   * EventHandler notify method
   * @param {function} fn Notify callback
   * @private
   */
  registerNotify(fn) {
    this.notify = fn
  }

  /**
   * Returns the current status of the connection
   * @return {number} Status identifier
   */
  status() {
    return this.socketStatus
  }

  /**
   * Connect to a Websocket server. Defaults to global options
   * @param {object} [customOptions] Custom options
   * @param {string} [customOptions.host] Hostname of Websocket server
   * @param {number} [customOptions.port] Port of Websocket server
   * @param {boolean} [customOptions.secure] Use wss:// for secure connections
   * @param {string|string[]} [options.protocol] Subprotocol of Websocket server
   */
  open(customOptions = {}) {
    const options = { ...this.options, ...customOptions }
    const {
      port, host, secure, protocol,
    } = options

    // close socket when already given
    if (this.socket) {
      this.close()
    }

    // create websocket client
    const scheme = secure ? 'wss' : 'ws'
    const rinfo = {
      address: host,
      family: scheme,
      port,
      size: 0,
    }

    if (port != null) {
      this.socket = new WebSocket(`${scheme}://${host}:${port}`, protocol)
    } else {
      this.socket = new WebSocket(`${scheme}://${host}`, protocol)
    }

    this.socket.binaryType = 'arraybuffer'
    this.socketStatus = STATUS.IS_CONNECTING

    // register events
    this.socket.onopen = () => {
      this.socketStatus = STATUS.IS_OPEN
      this.notify('open')
    }

    this.socket.onclose = () => {
      this.socketStatus = STATUS.IS_CLOSED
      this.notify('close')
    }

    this.socket.onerror = (error) => {
      this.notify('error', error)
    }

    this.socket.onmessage = (message) => {
      this.notify(message.data, rinfo)
    }
  }

  /**
   * Close Websocket
   */
  close() {
    this.socketStatus = STATUS.IS_CLOSING
    this.socket.close()
  }

  /**
   * Send an OSC Packet, Bundle or Message to Websocket server
   * @param {Uint8Array} binary Binary representation of OSC Packet
   */
  send(binary) {
    this.socket.send(binary)
  }
}
