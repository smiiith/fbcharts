import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import './index.css';

function Play (props) {
	let listItems = [];

	if (props.actions) {
		listItems = props.actions.map((play) =>
			<li>{play.summary}</li>
		);
	}
return listItems;
	return (
			(props.actions) ?
			<li>{props.actions[0].summary}</li>:
			<li>'no'</li>
		
	)
}

function Drive (props) {
	return (
		<div>
			<div>{props.type} : {props.team} : {props.summary}</div>
			<ul>
				<Play
					team={props.team}
					actions={props.actions}
				></Play>
			</ul>
		</div>
	)
}

class Game extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			isReady : false,
			pageTitle : 'Waiting',
			playbyplay : 'Loading plays'
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
			ctx.setState({ pageTitle : xhr.away_team.market + ' vs. ' + xhr.home_team.market });
			ctx.renderPlayByPlay(xhr.quarters[0].pbp);
		})
		.fail(function(xhr, status, error) {
			alert( 'error status: ' + status );
		})
		.always(function() {
			// alert( "complete" );
		});

	}

	renderPlayByPlay (pbp) {
		this.setState({ playbyplay : pbp.map((event) => 
			<Drive
				key={event.id}
				type={event.type}
				team={event.team}
				summary={event.summary}
				actions={event.actions}

			>
			</Drive>

			)
		});
	}

	render() {
		return (
			<div>
				<h1>
					{ this.state.pageTitle }
				</h1>
				<div>
					{this.state.playbyplay}
				</div>
			</div>
		)
	}
}


// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

