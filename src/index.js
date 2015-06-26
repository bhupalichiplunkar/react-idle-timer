/**
 * React Idle Timer
 *
 * @author  Randy Lebeau
 * @class 	IdleTimer
 *
 */

import React from 'react/addons';

export default React.createClass({

	/////////////////////
	// React Lifecycle //
	/////////////////////

	displayName: 'IdleTimer',

	propTypes: {
		timeout: React.PropTypes.number, 							// Activity timeout
		events: React.PropTypes.arrayOf(React.PropTypes.string),	// Activity events to bind
		idleAction: React.PropTypes.func, 							// Action to call when user becomes inactive
		activeAction: React.PropTypes.func,							// Action to call when user becomes active
		element: React.PropTypes.oneOfType([						// Element ref to watch activty on
			React.PropTypes.object,
			React.PropTypes.string
		])
	},

	getDefaultProps() {
		return {
			timeout: 1000 * 60 * 20, // 20 minutes
			events: [
				'mousemove',
				'keydown',
				'wheel',
				'DOMMouseScroll',
				'mouseWheel',
				'mousedown',
				'touchstart',
				'touchmove',
				'MSPointerDown',
				'MSPointerMove'
			],
			idleAction: function() {},
			activeAction: function() {},
			element: document
		};
	},

	getInitialState() {
		return {
			idle: false,
			oldDate: +new Date(),
			lastActive: null,
			remaining: null,
			tId: null,
			pageX: null,
			pageY: null
		};
	},

	componentWillMount() {
		this.props.events.forEach((event) => {
			this.props.element.addEventListener(event, this._handleEvent);
		});
	},

	componentWillUnmount() {
		this.props.events.forEach((event) => {
			this.props.element.removeEventListener(event, this._handleEvent);
		});
	},

	render() { return this.props.children; },

	/////////////////////
	// Private Methods //
	/////////////////////

	/**
	 * Toggles the idle state and calls the proper action
	 *
	 * @return {void}
	 *
	 */

	_toggleIdleState() {

		// Fire the appropriate action
		if(this.state.idle) {
			this.props.activeAction();
		} else {
			this.props.idleAction();
		}

		// Set the state
		this.setState({ idle: !this.state.idle });

	},

	/**
	 * Event handler for supported event types
	 *
	 * @param  {Object} e event object
	 * @return {void}
	 *
	 */
	_handleEvent(e) {

		// Already idle, ignore events
		if (this.state.remaining) return;

		// Mousemove event
		if (e.type === "mousemove") {
			// if coord are same, it didn't move
			if (e.pageX === this.state.pageX && e.pageY === this.state.pageY) {
				return;
			}
			// if coord don't exist how could it move
			if (typeof e.pageX === "undefined" && typeof e.pageY === "undefined") {
				return;
			}
			// under 200 ms is hard to do, and you would have to stop, as continuous activity will bypass this
			let elapsed = (+new Date()) - this.state.oldDate;
			if (elapsed < 200) {
				return;
			}
		}

		// clear any existing timeout
        clearTimeout(this.state.tId);

        // if the idle timer is enabled, flip
        if (this.state.idle) {
            this._toggleIdleState(e);
        }

        // store when user was last active
        this.state.lastActive = +new Date();

        // update mouse coord
        this.state.pageX = e.pageX;
        this.state.pageY = e.pageY;

        // set a new timeout
        this.state.tId = setTimeout(this._toggleIdleState, this.props.timeout);

	},

	////////////////
	// Public API //
	////////////////

	/**
	 * Restore initial settings and restart timer
	 *
	 * @return {Void}
	 *
	 */

	reset() {

        // reset timers
		clearTimeout(this.state.tId);

		// reset settings
        this.setState({
        	idle: false,
        	oldDate: +new Date(),
        	lastActive: this.state.oldDate,
        	remaining: null,
        	tId: !this.state.idle ? setTimeout(this._toggleIdleState, this.props.timeout) : null
        });
	},

	/**
	 * Store remaining time and stop timer.
	 * You can pause from idle or active state.
	 *
	 * @return {Void}
	 *
	 */
	pause() {
		// this is already paused
        if ( this.state.remaining != null ) { return; }

        // define how much is left on the timer
        this.state.remaining = this.props.timeout - ((+new Date()) - this.state.oldDate);

        // clear any existing timeout
        clearTimeout(this.state.tId);
	},

	/**
	 * Resumes a stopped timer
	 *
	 * @return {Void}
	 *
	 */
	resume() {

        // this isn't paused yet
        if ( this.state.remaining === null ) { return; }

        // start timer and clear remaining
        if ( !this.state.idle ) {
            this.setState({
            	tId: setTimeout(this._toggleIdleState, this.state.remaining),
            	remaining: null
            });
        }
	},

	/**
	 * Time remaining before idle
	 *
	 * @return {Number} Milliseconds remaining
	 *
	 */
	getRemainingTime() {

		// If idle there is no time remaining
		if ( this.state.idle ) { return 0; }

		// If its paused just return that
		if ( this.state.remaining != null ) { return this.state.remaining; }

		// Determine remaining, if negative idle didn't finish flipping, just return 0
		let remaining = this.props.timeout - ((+new Date()) - this.state.lastActive);
		if (remaining < 0) { remaining = 0; }

		// If this is paused return that number, else return current remaining
		return remaining;
	},

	/**
	 * How much time has elapsed
	 *
	 * @return {Timestamp}
	 *
	 */
	getElapsedTime() {
		return (+new Date()) - this.state.oldDate;
	},

	/**
	 * Last time the user was active
	 *
	 * @return {Timestamp}
	 *
	 */
	getLastActiveTime() {
		return this.state.lastActive;
	},

	/**
	 * Is the user idle
	 *
	 * @return {Boolean}
	 *
	 */
	isIdle() {
		return this.state.idle;
	}

});
