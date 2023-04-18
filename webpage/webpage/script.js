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
	fetch(`http://localhost:8000/fetch?${type == 'answer' ? `btnPos=${JSON.stringify(blockNow.pos)}&answer=${userAnswer}&` : ``}id=${roomId}&user=${username}&type=${type}${type == 'question-select' ? `&btnPos=${JSON.stringify(blockNow.pos)}` : ``}`)
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
	document.getElementById('username').style.display = 'none'

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
	var inputElem = document.getElementById('username')
	var value = inputElem.value
	inputElem.value = ''
	if(state == 'waitForRoomId') {
		if(!roomsData[value])
			return alert('Неверный ID команды')
		roomId = value
		inputElem.placeholder = 'введите имя команды'
		state = 'waitForUsername'
	}
	else if(state == 'waitForUsername') {
		username = value
		if (!roomsData[roomId].all.includes(username))
			return alert('Такая команда не существует')
		if (roomsData[roomId].joined.includes(username))
			return alert('Команда набрана!')
		waitForOthers()
			
	}
}

function create_room() {
	hideWeloceElements()
	document.getElementById('create-team').style.display = 'inline'
	document.getElementById('information').style.display = 'inline'
	document.getElementById('submit-teams').style.display = 'inline'
	//document.getElementById('text-teams').style.display = 'inline'
	document.getElementById('team').style.display = 'block'
}

function join_room() {

	hideWeloceElements()
	document.getElementById('username').style.display = 'block'
	document.getElementById('submit_username').style.display = 'block'

	fetch(`http://localhost:8000/fetch?type=get-all`) //отправляем запрос на создание комнаты
		.then(data => data.json())
		.then(async function (data) {
			roomsData = data
		})
		.catch(err => { console.log(err); alert('can\'t connect to servers'); debugger; })
	
}

function hideWeloceElements() {
	document.getElementById('welcome-text').style.display = 'none'
	document.getElementById('create-room').style.display = 'none'
	document.getElementById('join-room').style.display = 'none'
	document.getElementById('about-game').style.display = 'none'
	
}

function create_team() {
	do {
		teamName = prompt(`enter a name of the team`)
	} while (teams.includes(teamName))
	teams.push(teamName)
	document.getElementById('team').innerHTML += `<button onClick="editTeam(this.id)" class='team-name' id='team:${teamName}'>${teamName}</button>`
}

function editTeam(elementID) {
	elem = document.getElementById(elementID);
	teams = teams.filter(item => item != elem.id.split(':')[1])
	elem.remove()
}

function submit_teams() {
	fetch(`http://localhost:8000/fetch?type=create_room&teams=${JSON.stringify(teams)}`) //отправляем запрос на создание комнаты
		.then(data => data.json())
		.then(async function (data) {
			document.getElementById('roomId').style.display = 'block'
			document.getElementById('roomId').innerHTML = `Ваша ссылка для приглашения учасников: <a href="${window.location.toString().split('?')[0]}?Id=${data.roomID}">${window.location.toString().split('?')[0]}?Id=${data.roomID}</a> `
		})
		.catch(err => { console.log(err); alert('can\'t connect to servers'); debugger; })
	document.getElementById('create-team').style.display = 'none'
	document.getElementById('information').style.display = 'none'
	document.getElementById('submit-teams').style.display = 'none'
	document.getElementById('team').style.display = 'none'

}
if(!isNaN(getQueryVariable('Id'))){ 
	roomId = getQueryVariable('Id')
	join_room() 
	state = 'waitForUsername'
	document.getElementById('username').placeholder = 'введите имя команды'
	//fetchTable('get')
}
//fetchTable('get')