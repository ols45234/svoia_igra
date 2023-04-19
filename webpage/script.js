var result = [];
var blockNow = {};
var balance = 0;
var gameData = {};
var state = 'waitForRoomId';
var userAnswer = '';
var roomId;
var playersNum = 0;
var lobby = true;
var firstNameFormChage = false;
var teams = [];
var roomsData = [];
var username = `player${Math.floor(Math.random() * 1000)}`;
var delay = ms => new Promise(res => setTimeout(res, ms));
var flag = false;
var serverIp = window.location.toString().split('/')[2]

function ask(block) {
	blockNow = block
	questionArea = document.getElementById('question')
	submitButton = document.getElementById('submit')
	answerArea = document.getElementById('answer')

	document.getElementById('table').style.display = 'none';

	questionArea.textContent = `Вопрос: ${block.question}`
	
	questionArea.style.display = 'block'
	submitButton.style.display = 'block'
	answerArea.style.display = 'block'
	document.getElementById('question-div').style.display = 'block'
}

function submit_answer() {
	answerElem = document.getElementById('answer')
	buttonElem = document.getElementById('submit')

	userAnswer = answerElem.value.toLowerCase()

	answerElem.style.display = 'none'
	buttonElem.style.display = 'none'
	document.getElementById('question').style.display = 'none'
	document.getElementById('table').style.display = 'inline-table'

	fetchTable('answer')
	
	document.getElementById('question-div').style.display = 'none'

	//document.getElementById('question').textContent = `Вопрос: `
}

async function reply() {
	fetchTable('reply')
}

function getUnicalElements(arr) {
	var output = ""
	arr.forEach(item => {
		if (!output.includes(item))
			output += `${item};`
	});
	output = output.slice(0, -1)
	return output.split(';')
}




function tableCreate(costs, topics) {
	tbl = document.getElementById("table");
	tbl.innerHTML = '' //чистим
	//tbl.style.wrowdth = '100px';
	//tbl.style.border = '1px solrowd black';
	for (let row = 0; row < topics.length + 1; row++) {
		const tr = tbl.insertRow();
		for (let col = 0; col < costs.length + 1; col++) {

			const td = tr.insertCell();
			try {
				if (row != 0 && col != 0 && result[row - 1][col - 1]) {
					var btn = document.createElement("button");
					btn.classList.add("question-select")
					btn.innerHTML = costs[col - 1];
					btn.disabled = !(state == 'waitForSelectThis')
					btn.onclick = function () {
						blockNow.pos = { x: row - 1, y: col - 1 };
						fetchTable('question-select')
					}

				} else if (row == 0 ^ col == 0) {  // ^ = XOR
					var btn = document.createElement("p");
					btn.innerHTML = `${(row == 0 ? costs[col - 1] : topics[row - 1])}`
					btn.classList.add("table-element")
				} else {
					var btn = document.createTextNode(``);
				}
				//console.log(btn)

				td.appendChild(btn);
				//td.style.border = '1px solid black';
			} catch (err) {
				debugger;
				console.log(e)
			}
		}
	}
	return
}

async function fetchTable(type) {
	//await delay(100)
	//console.log('fetch')
	fetch(`http://${serverIp}/fetch?${type == 'answer' ? `btnPos=${JSON.stringify(blockNow.pos)}&answer=${userAnswer}&` : ``}id=${roomId}&user=${username}&type=${type}${type == 'question-select' ? `&btnPos=${JSON.stringify(blockNow.pos)}` : ``}`)
		.then(data => data.json())
		.then(async function (data) {
			processServerRes(data)
		})
		.catch(err => { console.log(err); alert('can\'t connect to servers'); debugger; })
}

async function processServerRes(data) {
	try {
		//debugger;
		playersNum = data.playersNum;
		document.getElementById('marker').textContent = `Waiting for other players(${playersNum}/${data.maxPlayers})... `

		if (playersNum >= data.maxPlayers && lobby)
			setup()

		gameData = data; //сохраняем
		balance = data.balance; // получаем баланс
		state = data.states[username]
		result = data.result //2д массив 

		if (state == 'waitForWhoAnswering') {
			document.getElementById('reply-div').style.display = 'block'
            document.getElementById('table').style.display = 'none'
            document.getElementById('question-preview').textContent = result[gameData.blockNow.pos.x][gameData.blockNow.pos.y].question
			document.getElementById('question-image').src = './images/' + (result[gameData.blockNow.pos.x][gameData.blockNow.pos.y].image || 'empty.png')
        }
		else
			document.getElementById('reply-div').style.display = 'none'
		if (state == 'waitForSelectOther' || state == 'waitForSelectThis')
			document.getElementById('table').style.display = 'table'

		if (state == 'waitForAnswerThis')
			ask(result[data.blockNow.pos.x][data.blockNow.pos.y])

		//console.log(data)

		balanceContent = `балас команд: <br>`
		Object.keys(balance).forEach(item => balanceContent += `${item}: ${balance[item]}<br>`)
		document.getElementById('balance').innerHTML = balanceContent //вывод баланса

		tableCreate(data.costsList, data.topicsList); //таблица

		//blockNow = {}; //убираем блок из памяти
		document.getElementById('answer').value = '' //стираем ответ

		await delay(1000)

		if (['waitForSelectOther', 'waitForSelectThis', 'waitForAnswerOther', 'waitForOthers', 'waitForWhoAnswering'].includes(state))
			fetchTable('get')
	} catch(err) {
		console.log(err)
	}
}

function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable)
			return pair[1];
	}
	return undefined;
}

function waitForOthers() {
	state = 'waitForOthers'

	document.getElementById('submit_username').style.display = 'none'
	document.getElementById('login').style.display = 'none'

	fetchTable('newPlayer')

	marker = document.getElementById('marker')
	marker.style.display = 'block'
	marker.textContent = `Waiting for other players(${playersNum}/3)... `

}
function setup() {
	document.getElementById('marker').style.display = 'none'

	fetchTable('get')
	document.getElementById('balance').style.display = 'block'
	document.getElementById('table').style.display = 'inline-table'

	lobby = false
}

async function apply_username() {
	var un = document.getElementById('username').value;
	var ri = parseInt(document.getElementById('game-id').value, 16);
	
	if(!roomsData[idHash(ri)])
		return alert('нет тут такой игры, ID неправильный')
	if (!roomsData[idHash(ri)].all.includes(un))
		return alert('нет тут такой команды')
	if (roomsData[idHash(ri)].joined.includes(un))
		return alert('команда набрана!')
	roomId = ri
	username = un
	waitForOthers()
}

function create_room() {
	hideWeloceElements()
	/*document.getElementById('create-team').style.display = 'inline'
	document.getElementById('team-create-name').style.display = 'inline'
	document.getElementById('information').style.display = 'inline'
	document.getElementById('submit-teams').style.display = 'inline'
	//document.getElementById('text-teams').style.display = 'inline'
	document.getElementById('team').style.display = 'block'*/
	document.getElementById('team-creating-ui').style.display = 'flex'
}

function join_room() {

	hideWeloceElements()
	document.getElementById('login').style.display = 'block'
	document.getElementById('submit_username').style.display = 'block'

	fetch(`http://${serverIp}/fetch?type=get-all`) //отправляем запрос на создание комнаты
		.then(data => data.json())
		.then(async function (data) {
			roomsData = data
		})
		.catch(err => { console.log(err); alert('can\'t connect to servers'); debugger; })
	
}

function hideWeloceElements() {
	document.getElementById('start').style.display = 'none'
}

function create_team() {
	//var defaultName = document.getElementById('team-create-name').value;
	var defaultName = 'новая команда'
	var teamName = defaultName;
	for(let i = 2; teams.includes(teamName); i++) {
		teamName = `${defaultName} (${i})`
	}
	teams.push(teamName)
	document.getElementById('team').innerHTML += `
		<div id='div-team:${teamName}'>
			<input type='text' value='${teamName}' maxlength="32" onChange="editTeam('div-team:${teamName}', this.value)"  onClick="this.select();">
			<button onClick="removeTeam('div-team:${teamName}')" class='team-name' id='button-team:${teamName}'>x</button>
		</div>
	`
}

function removeTeam(elementID) {
	elem = document.getElementById(elementID);
	teams = teams.filter(item => item != elementID.split(':')[1])
	elem.remove()
}
function editTeam(elementID, defName) {
	var name = defName;
	for(let i = 2; teams.includes(name); i++) 
		name = `${defName} (${i})`
	elem = document.getElementById(elementID);
	teams = teams.map(item => ((item == elementID.split(':')[1]) ? name : item))
	elem.id = `div-team:${name}`
	elem.innerHTML = `
		<input type='text' value='${name}' maxlength="32" onChange="editTeam('div-team:${name}', this.value)" onClick="this.select();">
		<button onClick="removeTeam('div-team:${name}')" class='team-name' id='button-team:${name}'>x</button>
	`
	
}

function submit_teams() {
	fetch(`http://${serverIp}/fetch?type=create_room&teams=${JSON.stringify(teams)}`) //отправляем запрос на создание комнаты
		.then(data => data.json())
		.then(async function (data) {
			document.getElementById('roomId').style.display = 'block'
			var roomID = data.roomID.toString(16).toUpperCase();
			var link = `${window.location.toString().split('?')[0]}?Id=${roomID}`
			document.getElementById('roomId').innerHTML = `Ваша ссылка для приглашения учасников: <a href=${link}>${link}</a>(ваш ID: ${roomID})`
		})
		.catch(err => { console.log(err); alert('can\'t connect to servers'); debugger; })
	document.getElementById('team-creating-ui').style.display = 'none'

}

function backToMain(divId) {
	document.getElementById(divId).style.display = 'none'
	document.getElementById('start').style.display = 'flex'
}

function idHash (id) {
	var level1 = id ^ 0x323B0239 // magic key (password), need sync
	var level2 = level1 / 0xFFFFFFFF
	var level3 = Math.sin(level2 * 90) * 0xFFFFFFFF
	var level4 = Math.floor(level3)
	return level4
}



if(getQueryVariable('Id') != undefined){ 
	roomIdHex = getQueryVariable('Id')
	roomId = parseInt(roomIdHex, 16);
	join_room();
	state = 'waitForUsername';
	document.getElementById('game-id').value = roomIdHex;
	document.getElementById('login-back').style.display = 'none'
	//document.getElementById('username').placeholder = 'введите имя команды'
	//fetchTable('get')
}
//fetchTable('get')
