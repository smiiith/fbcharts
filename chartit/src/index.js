import React from 'react';
import ReactDOM from 'react-dom';
import ReactModal from 'react-modal';
import $ from 'jquery';
import './index.css';

// bind modal to root app element
ReactModal.setAppElement('#root');

function formatActions (actions, team) {
	var newActions = [];
	if (actions) {
		// newActions = actions.map(function(elem, idx, orig) {
		// 	if (elem.type != 'play') {
		// 		break;
		// 	}
		// 	var newElem = elem, prevIdx = idx-1;
		// 	if (orig[prevIdx]) {
		// 		newElem.lastYardLine = orig[prevIdx].yard_line;
		// 		newElem.lastSide = orig[prevIdx].side;
		// 		newElem.lastSummary = orig[prevIdx].summary;
		// 	}
		// 	return newElem;
		// });

		let filteredActions = actions.filter(function(elem) {
			if (elem.type === 'event') {
				return false;
			}
			elem.team = team;
			return true;
		});

		newActions = filteredActions.reduce(function(result, elem, idx, orig) {
			var newElem = elem, prevIdx = idx-1;
			if (result[prevIdx] && orig[prevIdx].type === 'play') {
				newElem.lastYardLine = result[prevIdx].yard_line;
				newElem.lastSide = result[prevIdx].side;
				newElem.lastSummary = result[prevIdx].summary;
			}
		    result.push(newElem);
		    return result;
		}, []);

		// console.log('in the map function ' + formattedActions);
	}
	return newActions;

}

// Play
// side (of field)
// yard marker (at start of play)
// previous side
// previous yard marker
function Play (props) {
	let plays = [];

	plays = props.driveData.plays.map((play) =>
		// <li>{props.homeTeam} == {calcYardsPerPlay( { yard_line : play.lastYardLine, side : play.lastSide }, { yard_line : play.yard_line, side : play.side }, props.team)} :: {play.lastSummary}</li>
		// <li className="drivebar hometeam" title={play.lastSummary} style={getPlayLengthStyle(props.homeTeam, play.team, play, calcYardsPerPlay( { yard_line : play.lastYardLine, side : play.lastSide }, { yard_line : play.yard_line, side : play.side }, props.team))} >
		<li className="hometeam">{play.summary}</li>
	);

	return plays;
}

class PlayList extends React.Component {

	constructor (props) {
		super(props);
		console.log('playlist constructor ' + this.props.isOpen);
		this.state = {
			showModal : false
		};

	}

	closeModal () {
		this.setState({
			showModal : false
		});
		// alert(this.state.showModal);
	}

	render() {
		console.log('isOpen ' + this.props.isOpen);
		const ctx = this;
		return (
	        <ReactModal 
	           isOpen={this.props.isOpen}
	           contentLabel="Minimal Modal Example"
	        >
	        	<button onClick={this.props.closeCallback}>close callback</button>
				<button onClick={function () { ctx.closeModal() } }>Close Modal</button>
				<ol className="playlist">
					<Play
						team={this.props.team}
						homeTeam={this.props.isHomeTeam}
						driveData={this.props.driveData}
					></Play>
				</ol>
	        </ReactModal>
		)
	}
}

class Drive extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			isPlayListHidden : true,
			showModal : false
		}

		// this.handleOpenModal = () => {
		// 	console.log('open modal');
		// 	this.setState({
		// 		showModal : true
		// 	});
		// }

	    this.handleOpenModal = this.handleOpenModal.bind(this);
	    this.handleCloseModal = this.handleCloseModal.bind(this);
	}

	componentDidMount () {
		let ctx = this;

		// listen for escape key and hide playlist when clicked
		window.addEventListener('keyup', function (e) {
			if (e.key === 'Escape') {
				ctx.closePlaylist();
			}
		});
	}

	closePlaylist () {
		this.setState({
			isPlayListHidden : true
		});
	}

	toggleHidden () {
		this.setState({
			isPlayListHidden : !this.state.isPlayListHidden
		});
	}

	handleOpenModal () {
		this.setState({ showModal: true });
	}

	handleCloseModal () {
		console.log('drive close func');
		this.setState({ showModal: false }, function () {
			console.log('drive callback func');
			this.setState({ showModal : false });
		});

	  //   this.setState((prevState, props) => ({
			// showModal: false
	  //   }));
	}

	render() {
		console.log('drive render func ' + this.state.showModal);
		const data = this.props;
		return (
			<div className={!data.isHomeTeam ? 'flipY' : ''}>
				<div>debug: {data.team}</div>
				<div className="drivebar" style={getDriveStyle(data.driveLength, data.startingYardLine)} onClick={this.handleOpenModal}>
					<PlayList 
						closeCallback={this.handleCloseModal} 
						isOpen={this.state.showModal}
						team={data.team}
						homeTeam={data.isHomeTeam} 
						driveData={data.driveData}>
					</PlayList>
				</div>
			</div>
		)
	}
}

class Game extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			isReady : false,
			pageTitle : 'Waiting',
			playbyplay : 'Loading plays',
			homeTeam : '',
			awayTeam : '',
			lastPlay : {
				side : '',
				yardLine : 0
			}
		}
	}

	componentDidMount () {
		var ctx = this;
		var xhr = $.ajax({
			// url : 'http://api.sportradar.us/ncaafb-t1/2018/REG/19/CLE/BAMA/pbp.json?api_key=mmzmk7zq4nf6bk8strmh937c',
			url : './target.json',
			dataType : 'json',
			method : 'GET'
		})
		.done(function(data, status) {
			ctx.setState({
				pageTitle : data.away_team.market + ' at ' + data.home_team.market,
				homeTeam : data.home_team.id,
				awayTeam : data.away_team.id
			});

			ctx.renderPlayByPlay(data);
		})
		.fail(function(xhr, status, error) {
			alert('error status: ' + status);
		})
		.always(function() {
			// update the grid height
			document.body.dispatchEvent(new Event('playsLoaded'));

		});

	}

	renderPlayByPlay (data) {
		this.setState({ playbyplay : data.drives.map((event) => 
			<Drive
				key={event.id}
				team={event.possession}
				side={event.startingSide}
				yardline={event.startingYardLine}
				isHomeTeam={event.isHomeTeam}
				driveLength={event.driveLength}
				startingYardLine={event.startingYardLine}
				driveData={event}
			>
			</Drive>

			)
		});
	}

	render() {
		return (
			<div className="fieldContainer">
				<h1>
					{ this.state.pageTitle }
				</h1>
				<div className="fieldSub" id="fieldContainer">
					<div className="field" ref={field => {this.field = field}}>
						{this.state.playbyplay}
					</div>
				</div>

				<Gridiron />
			</div>
		)
	}
}

class Gridiron extends React.Component {

	constructor (props) {
		super(props);
		this.state = {
			isPlayListHidden : true,
			height : '200px'
		}
	}

	componentDidMount () {
		const ctx = this;
		document.body.addEventListener('playsLoaded', function () { ctx.adjustGridiron (ctx)});
	}

	adjustGridiron (ctx) {
		let fieldHeight = document.getElementById('fieldContainer').offsetHeight;
		fieldHeight = fieldHeight ? fieldHeight + 25 : 25;

		ctx.setState({
			height : fieldHeight + 'px'
		});
	}

	render() {
		return (
			<div className="gridiron" ref={elem => this.gridiron = elem} style={ { height: `${ this.state.height }` } }>
				<div className="gridline">10</div>
				<div className="gridline">20</div>
				<div className="gridline">30</div>
				<div className="gridline">40</div>
				<div className="gridline">50</div>
				<div className="gridline">40</div>
				<div className="gridline">30</div>
				<div className="gridline">20</div>
				<div className="gridline">10</div>
				<div className="gridline"></div>
			</div>
		)
	}

}

// ========================================

function showPlays (e) {
	console.log('showPlays ' + e);
}

function calcYardsPerPlay (play, team) {
	let yards = 0;
	// make this a switch statement
	// if (team == play.startingSide && team == play.endingSide) {
	// 	yards = endYardline.yard_line - startYardline.yard_line;
	// } else if (team != play.startingSide && team != play.endingSide) {
	// 	yards = startYardline.yard_line - endYardline.yard_line;
	// } else if (team == play.startingSide && team != play.endingSide) {
	// 	yards = (50 - startYardline.yard_line) + (50 - endYardline.yard_line);
	// } else if (team != play.startingSide && team == play.endingSide) {
	// 	yards = -1 * ((50 - startYardline.yard_line) + (50 - endYardline.yard_line));
	// }

	return yards;
}

function getDriveStyle (driveLength, startingYardLine) {
	const yardFactor = 10;
	return {
		// width : (driveLength * yardFactor) + 'px',
		// marginLeft : (startingYardLine * yardFactor) + 'px'
		width : driveLength + '%',
		marginLeft : startingYardLine + '%'
	};
}

function getPlayStyle (yards) {
	return {
		width : (yards * 10) + 'px'
	}
}

// deprecated
function getPlayLengthStyle (homeTeam, team, play, yards) {
	let margLeft = (play.side != play.lastSide) ? (play.lastYardLine) : play.lastYardLine;
	if (team != play.lastSide) {
		margLeft = 100 - margLeft;
	}
	if (yards) {
		let retVal = {
			// backgroundColor : '#990000',
			width : (yards * 10) + 'px',
			height : '15px',
			border : 'solid 1px #ccc'
			// marginLeft : (margLeft * 10) + 'px'
		}
		return retVal;
	} else {
		return {
			display : 'none'
		}
	}
}


// ========================================
ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

