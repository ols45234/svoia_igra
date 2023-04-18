const XLSX = require('xlsx');
const readline = require('readline');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
 
app.use(express.static(`${__dirname}/webpage`));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const hostname = 'localhost';
const port = 80;
var result = [],
	pack = {},
	sessions = [],
	logs = [], //logs - брёвна
	allRooms = {}
	


app.get('/fetch', function (req, res) {
try {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Content-Type", "application/json");
	var resCode = 500
	var reqData = {}
	console.log(req.url)
	req.url = decodeURI(req.url)


	req.url.slice(req.url.indexOf('?')+1) // всё перед ? и символ ? игнорируем
		.replaceAll('%22', '\"') // убираем %22 в get запросе
		.split('&') //разделяем строку на массив по символу &
		.map(elem => ({ name: elem.split('=')[0], data: elem.split('=')[1] })) //каждый элемент массива преобразуем в объект
		.forEach(({ name, data }) => { reqData[name] = data })  //и проходясь по массиву, переписываем всё в 1 объект
	if(reqData.type != 'get') console.log(reqData)
	if(reqData.type != 'get') console.log(sessions)
	//console.log(sessions)
	//console.log(req.url)

	if(reqData.type == 'create_room') {
		var Id;
		do {
			Id = Math.floor(Math.random() * (16 ** 8));
		} while(sessions[Id] != undefined)
		sessions[Id] = JSON.parse(JSON.stringify(pack)) // ладно. Это нужно, чтобы при изменении одного объекта, другой не изменялся
		sessions[Id].roomID = Id
		sessions[Id].playerNames = JSON.parse(reqData.teams)
		sessions[Id].maxPlayers = sessions[Id].playerNames.length
		
		allRooms[idHash(Id)] = {}
		allRooms[idHash(Id)].all = JSON.parse(reqData.teams)
		allRooms[idHash(Id)].joined = []
		//sessions.forEach(item => item.allRooms = allRooms)
		resCode = 200
	}
	else
		var Id = parseInt(reqData.id)
	
	if(!sessions[Id] && !['get-all'].includes(reqData.type)) {
		resCode = 502
		console.log('user enter an invalid game code')
	}
	
	if(['get', 'get-all'].includes(reqData.type))
		resCode = 200

	
	
	
	if(reqData.type == 'answer') { // если прилетели данные о том что надо изменить поле
		var {x, y} = JSON.parse(reqData.btnPos) // распаковываем из строки в 2 числа 
		//sessions[Id].blockNow = {} // стираем блок
		var right = result[x][y].answer == reqData.answer // ответ правилен (хранит лог. значение true = правильно false = не правильно)
		user = reqData.user
		console.log(user)
		
		sessions[Id].balance[user] += result[x][y].cost * (right ? 1 : -1)
		
		
		var now = new Date(); //  получаем дату
		time = '[' + ("0" + now.getHours()).slice(-2) + ':' + ("0" + now.getMinutes()).slice(-2) + ':' + ("0" + now.getSeconds()).slice(-2) + ']' //конвертируем
		console.log(`${time} question: "${result[x][y].question}", correct answer: "${result[x][y].answer}", user's answer: "${reqData.answer}", room: ${Id}, user:${user}, now has ${sessions[Id].balance[user]}`)
		logs.push({time: time, question: result[x][y].question, correct: result[x][y].answer, answer: reqData.answer, roomId: Id, user: user, balance: sessions[Id].balance[user]})
		//console.log(logs) //коноль.бревно(брёвна)
		
		const ws = XLSX.utils.json_to_sheet(logs) // ну, в консоль брёвна все не поместятся, вываливаем в экзель файл
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'main')
		XLSX.writeFile(wb, 'log.xlsx')
		
		
		
		//console.log(`ID: ${Id} pos: x:${x} y:${y}, user's answer: ${reqData.answer}`)
		sessions[Id].result[x][y] = undefined; // затираем ячейку по позиции нажатой кнопки
		
		Object.keys(sessions[Id].states).forEach(item => sessions[Id].states[item] = 'waitForSelectOther');
		sessions[Id].states[sessions[Id].selectingPlayer] = 'waitForSelectThis'
		resCode = 200
	}
	if(reqData.type == 'newPlayer' && !sessions[Id].players.includes(reqData.user) && sessions[Id].playerNames.includes(reqData.user)) {
		sessions[Id].playersNum += 1

		sessions[Id].states[reqData.user] = 'waitForOthers'
		sessions[Id].players.push(reqData.user)
		allRooms[idHash(Id)].joined.push(reqData.user)

		if(!sessions[Id].selectingPlayer) sessions[Id].selectingPlayer = reqData.user;
		
		if(isNaN(sessions[Id].balance[reqData.user])) sessions[Id].balance[reqData.user] = 0
		
		if(sessions[Id].playersNum == sessions[Id].maxPlayers) {
			Object.keys(sessions[Id].states).forEach(item => sessions[Id].states[item] = 'waitForSelectOther');
			sessions[Id].states[sessions[Id].selectingPlayer] = 'waitForSelectThis'
		}
		resCode = 200
	}
	if(reqData.type == 'question-select') {
		Object.keys(sessions[Id].states).forEach(item => sessions[Id].states[item] = 'waitForWhoAnswering');
		var {x, y} = JSON.parse(reqData.btnPos);
		sessions[Id].blockNow = sessions[Id].result[x][y]
		sessions[Id].blockNow.pos = JSON.parse(reqData.btnPos)
		resCode = 200
	}
	if(reqData.type == 'reply') {
		Object.keys(sessions[Id].states).forEach(item => sessions[Id].states[item] = 'waitForAnswerOther');
		sessions[Id].selectingPlayer = reqData.user
		sessions[Id].states[sessions[Id].selectingPlayer] = 'waitForAnswerThis'
		resCode = 200
	}
	
	if(!sessions[Id] && !['get-all'].includes(reqData.type)) {
		resCode = 502
		console.log('user enter an invalid game code')
	}
	


	
	
	if(reqData.type != 'get') console.log(reqData)
	if(reqData.type != 'get') console.log(sessions)
	if(reqData.type != 'get') console.log(allRooms)
	
	res.writeHead(resCode);
	if(resCode != 200) {
		console.log('error occurred')
		debugger;
	}
	if(reqData.type == 'get-all')
		res.end(JSON.stringify(allRooms, null)); //отправляем пакет
	else if(resCode == 200)
		res.end(JSON.stringify(sessions[Id], null)); //отправляем пакет
	else
		res.end(`{"message": "An error has occurred", "errorCode": "${resCode}"}`); //отправляем пакет
		
} catch(err) {
	console.log(err)
}
	
});




async function readExelFile() {
	filename = 'table'
	
	rl.question('please, enter file name or path to file with file name (оставьте поле пустым для автоматической загрузки таблицы вопросов идущей в архиве):\n> ', function (name) {
		filename = name || 'table'
		
		var extension = filename.substring(filename.lastIndexOf(".")).toUpperCase();
		if (extension != '.XLS' && extension != '.XLSX')
			filename += '.XLSX'

		try {
			var workbook = XLSX.readFile(filename);
			var exelFile = {};
			workbook.SheetNames.forEach(function (sheetName) {
				var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
				if (roa.length > 0) {
					exelFile[sheetName] = roa;
				}
			});
			exelFile.main.shift()
			exelFile.main.sort((a, b) => a.cost - b.cost) // сразу сортирем по ценам вопроса	
			processFile(exelFile);
		} catch (e) {
			console.error(e);
		}
	})
	
}

async function processFile(exelFile) {
	topicsList = []; // создаём списки для тем и цен вопросов
	costsList = [];
	exelFile.main.forEach(item => { //распределяем
		topicsList.push(item.topic);
		costsList.push(item.cost);
	});

	topicsList = getUnicalElements(topicsList); //убираем повторения
	costsList = getUnicalElements(costsList); //и тут тоже

	topics = {};
	costs = {};
	topicsList.forEach((item, i) => topics[item] = i);
	costsList.forEach((item, i) => costs[item] = i);

	exelFile.main.forEach(item => {
		if (!result[topics[item.topic]])
			result.push([])
		result[topics[item.topic]][costs[item.cost]] = item
	});
	pack.result = JSON.parse(JSON.stringify(result))
	pack.topicsList = topicsList
	pack.costsList = costsList
	pack.result.forEach(item => item.forEach(elem => elem.answer = 'NO_PEEKING')) //замазываем ответы
	pack.balance = {}
	pack.playersNum = 0
	pack.playerNames = []
	pack.players = []
	pack.states = {}
	pack.selectingPlayer = ''
	pack.blockNow = {}
	pack.maxPlayers = 3
	pack.roomID = 0

	app.listen(process.env.PORT || port, () => {
		console.log(`server started!`)
	});
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

function idHash (id) {
	var level1 = id ^ 0x323B0239 // magic key (password), need sync
	var level2 = level1 / 0xFFFFFFFF
	var level3 = Math.sin(level2 * 90) * 0xFFFFFFFF
	var level4 = Math.floor(level3)
	return level4
}


readExelFile()