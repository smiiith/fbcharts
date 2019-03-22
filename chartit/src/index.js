import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import './index.css';

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
	// let formattedActions = [];

		// formatActions(props.actions);

	if (props.actions) {
		let formattedActions = formatActions(props.actions, props.team);

		if (formattedActions.length > 0) {

			plays = formattedActions.map((play) =>
				// <li>{props.homeTeam} == {calcYardsPerPlay( { yard_line : play.lastYardLine, side : play.lastSide }, { yard_line : play.yard_line, side : play.side }, props.team)} :: {play.lastSummary}</li>
				<li className="drivebar hometeam" title={play.lastSummary} style={getPlayLengthStyle(props.homeTeam, play.team, play, calcYardsPerPlay( { yard_line : play.lastYardLine, side : play.lastSide }, { yard_line : play.yard_line, side : play.side }, props.team))} >
				</li>
			);
		}
	}
return plays;
}

class Drive extends React.Component {
	constructor (props) {
		super(props);
	}

	render() {
		const current = this.props;
		// if (!current.actions) {
		// 	return false;
		// }
		// this.setState({ lastPlay : {
		// 	side : current.side,
		// 	yardLine : current.yard_line
		// }});

		return (
			<div className={(current.team === this.props.homeTeam) ? 'flipY' : ''}>
				<div>{current.team}</div>
				<ul className="drivebar" style={getDriveStyle(current.actions.yard_line)}>
					<Play
						team={current.team}
						actions={current.actions}
						lastPlay={current.lastPlay}
						homeTeam={this.props.homeTeam}
					></Play>
				</ul>
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
			url : './gamedata.js',
			dataType : 'json',
			method : 'GET'
		})
		.done(function(xhr, status) {
			ctx.setState({
				pageTitle : xhr.away_team.market + ' vs. ' + xhr.home_team.market,
				homeTeam : xhr.home_team.id,
				awayTeam : xhr.away_team.id
			});

			ctx.renderPlayByPlay(xhr.quarters[0].pbp, xhr.home_team.id);
		})
		.fail(function(xhr, status, error) {
			alert( 'error status: ' + status );
		})
		.always(function() {
			// alert( "complete" );
		});

	}

	renderPlayByPlay (pbp, homeTeam) {
		this.setState({ playbyplay : pbp.map((event) => 
			<Drive
				key={event.id}
				type={event.type}
				team={event.team}
				summary={event.summary}
				actions={(event.actions) ? event.actions : []}
				side={event.side}
				yardline={event.yard_line}
				homeTeam={homeTeam}
			>
			</Drive>

			)
		});
	}

	render() {
		return (
			<div class="fieldContainer">
				<h1>
					{ this.state.pageTitle }
				</h1>
				<div className="fieldSub">
					<div className="field" ref={field => {this.field = field}}>
						{this.state.playbyplay}
					</div>
				</div>
				<div class="gridiron">
					<div class="gridline">10</div>
					<div class="gridline">20</div>
					<div class="gridline">30</div>
					<div class="gridline">40</div>
					<div class="gridline">50</div>
					<div class="gridline">40</div>
					<div class="gridline">30</div>
					<div class="gridline">20</div>
					<div class="gridline">10</div>
					<div class="gridline"></div>
				</div>
			</div>
		)
	}
}


// ========================================

function calcYardsPerPlay (startYardline, endYardline, team) {
	let yards = 0;
	// make this a switch statement
	if (team == startYardline.side && team == endYardline.side) {
		yards = endYardline.yard_line - startYardline.yard_line;
	} else if (team != startYardline.side && team != endYardline.side) {
		yards = startYardline.yard_line - endYardline.yard_line;
	} else if (team == startYardline.side && team != endYardline.side) {
		yards = (50 - startYardline.yard_line) + (50 - endYardline.yard_line);
	} else if (team != startYardline.side && team == endYardline.side) {
		yards = -1 * ((50 - startYardline.yard_line) + (50 - endYardline.yard_line));
	}

	return yards;
}

function getDriveStyle (start) {
	return {
		marginLeft : (start * 10) + 'px'
	};
}

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

