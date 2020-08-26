let enemyTable = document.getElementById('enemy');
let allyTable = document.getElementById('ally');
let numberShips = document.getElementById('numShips');
numberShips.focus();

createTable(allyTable);
createTable(enemyTable);
onOffField('on_off_ally', 'off');
onOffField('on_off_enemy', 'off');

let initCell = { // модель объекта
    ship: false, // если установлен корабль - true
    hit: false, // если было попадание по кораблю - true
    miss: false, // если был промах - true
    emptyCell: false // если яцейка оказалась пустой - true
};

let allyField;
let enemyField;
let allyIndicator;
let enemyIndicator;
let number;
let counterAllyShips = 0;
let counterEnemyShips = 0;
let counterAllyMoves, counterEnemyMoves;
let whoMoves = true; // true - наш ход; false - ход противника
let winner = {
    ally: 0,
    enemy: 0
}
/////////////////////////////////////////////////////////////////////////////////////////

numberShips.addEventListener('input', event => {
    let value = event.target.value;
    if (value >= 15) {
        event.target.value = 15;
    } else if (value <= 3 || value === '') {
        event.target.value = 3;
    }
    document.getElementById('set_position').removeAttribute('disabled');
})

document.getElementById('set_position').addEventListener('click', () => {
    number = +numberShips.value;
    allyField = createField(initCell);
    enemyField = createField(initCell);

    createRandonShips(enemyField, number, enemyTable);
    enemyIndicator = new lineIndicator(number, 'icon_enemy_ships', 'alive_ship');
    deleteAllClass(enemyTable, 'play');

    if (document.getElementById('random').checked) {
        // рандомный порядок расстановки кораблей
        deleteAllClass(allyTable, 'none');
        createRandonShips(allyField, number, allyTable);
        onOffField('on_off_ally', 'off'); // выключаем поле

        allyIndicator = new lineIndicator(number, 'icon_ally_ships', 'alive_ship');
        document.querySelector('.to-battle').classList.add('to-battle-on');
    } else {
        // ручной порядок расстановки кораблей
        deleteAllClass(allyTable, 'main_behavior');
        onOffField('on_off_ally', 'on'); // включаем поле
        allyIndicator = new lineIndicator(number, 'icon_ally_ships', 'init_ship'); // создаём индикатор
        let counter = 0;

        allyTable.addEventListener('click', clickCell);
        allyTable.addEventListener('mouseover', mouseOverCell);

        function clickCell(event) {
            if (event.target.localName === 'div') {
                let index = +event.target.dataset.index;

                if (allyField[index].ship || allyField[index].emptyCell) {
                    setAudio('assets/bad_idea.mp3', 0.8);
                    return;
                } else {
                    allyField[index].ship = true;
                    setEmptyArea(index, allyField);
                    allyIndicator.changeStatus('alive_ship');
                    counter++;
                    setAudio('assets/good.mp3', 0.8);

                    if (number === counter) {
                        allyTable.removeEventListener('click', clickCell);
                        allyTable.removeEventListener('mouseover', mouseOverCell);
                        allyField.forEach(value => value.emptyCell = false);
                        deleteAllClass(allyTable, 'none');
                        renderField(allyTable, allyField, 'ally', 'none'); // рендер поля
                        onOffField('on_off_ally', 'off'); // выключаем поле
                        document.querySelector('.to-battle').classList.add('to-battle-on');
                        return;
                    }
                    renderField(allyTable, allyField, 'ally', 'main_behavior'); // рендер поля
                }
            }
        }

        function mouseOverCell(event) {
            if (event.target.localName === 'div') {
                let index = +event.target.dataset.index
                allyField[index].ship || allyField[index].emptyCell ?
                    event.target.classList.add('err_set_ship') :
                    event.target.classList.replace('err_set_ship', 'main_behavior');
            }
        }
    }
})

document.querySelector('.battle').addEventListener('click', () => {
    setAudio('assets/ready.mp3', 0.8);
    document.querySelector('.to-battle').classList.remove('to-battle-on');
    document.querySelector('.first-control').classList.add('first-control-off');
    onOffField('on_off_ally', 'on'); // включаем поле
    onOffField('on_off_enemy', 'on'); // включаем поле
    counterAllyShips = number;
    counterEnemyShips = number;
    counterAllyMoves = counterEnemyMoves = 0;

    enemyTable.addEventListener('click', battle);
})

function battle(event) {
    if (event.target.localName === 'div') {
        let index = +event.target.dataset.index;

        if (event.target.classList.value === 'play') counterAllyMoves++; // счетчик ходов
        document.getElementById('al_st').innerHTML = `Количество ходов: <strong>${counterAllyMoves}</strong>`;

        // наш ход
        if (whoMoves) {
            if (enemyField[index].ship && !enemyField[index].hit) {
                enemyField[index].hit = true;
                enemyIndicator.changeStatus('dead_ship_icon');
                // зонa вокруг подбитого корабля
                setEmptyArea(index, enemyField);
                counterEnemyShips--;
                setAudio('assets/dead.mp3', 0.3)

                if (counterEnemyShips === 0) {
                    enemyTable.removeEventListener('click', battle);
                    viewRezult('ally'); // вывод результата
                }
                whoMoves = true;
            } else if (!enemyField[index].emptyCell && !enemyField[index].miss && !enemyField[index].hit) {
                enemyField[index].miss = true;
                whoMoves = false;
                setAudio('assets/shot.mp3', 0.15)
            }
            renderField(enemyTable, enemyField, 'enemy', 'play'); // рендер поля
        }

        // ход противника
        if (whoMoves === false) {
            enemyMoves();
        }
    }
}

async function enemyMoves() {
    onOffField('on_off_enemy', 'off'); // выключаем поле противника
    while (whoMoves === false) {
        await enemyMove();
        document.getElementById('en_st').innerHTML = `Количество ходов: <strong>${counterEnemyMoves}</strong>`;
    }
    onOffField('on_off_enemy', 'on'); // включаем поле противника
}

function enemyMove() {
    return new Promise((resolve) => {
        setTimeout(() => {
            let condition = true;
            let index;
            while (condition) {
                index = Math.floor(Math.random() * 100) + 1;
                if (!allyField[index].hit && !allyField[index].miss && !allyField[index].emptyCell) condition = false;
            }

            if (allyField[index].ship) {
                allyField[index].hit = true;
                allyIndicator.changeStatus('dead_ship_icon');
                // зонa вокруг подбитого корабля
                setEmptyArea(index, allyField);
                counterAllyShips--;
                whoMoves = false;
                setAudio('assets/dead.mp3', 0.3)
            } else {
                allyField[index].miss = true;
                whoMoves = true;
                setAudio('assets/z_uk-_ystrely (mp3cut.net).mp3', 0.15)
            }

            renderField(allyTable, allyField, 'ally', 'none'); //рендер поля
            counterEnemyMoves++; // счетчик ходов

            if (counterAllyShips === 0) {
                enemyTable.removeEventListener('click', battle);
                viewRezult('enemy'); // вывод результата
                whoMoves = true;
            }

            resolve();
        }, 1000); // 500
    })
}

function viewRezult(side = '') {
    setTimeout(() => {
        document.getElementById('rev-div').classList.remove('res-disable');
        if (side === 'ally') {
            document.getElementById('winner_label').innerHTML = 'Мы победили!';
            document.getElementById('reset').innerHTML = 'На абордаж!'
            setAudio('assets/win.mp3', 0.8);
            winner.ally += 1;
            setRezult(counterAllyMoves, 'ТАК ДЕРЖАТЬ БОЕЦ!');
        } else {
            document.getElementById('winner_label').innerHTML = 'Противник выиграл!';
            document.getElementById('reset').innerHTML = 'Отыграться!'
            setAudio('assets/gameover.mp3', 0.8);
            winner.enemy += 1;
            setRezult(counterEnemyMoves, 'СОБЕРИСЬ БОЕЦ!');
        }
    }, 1000);
}

function setRezult(counter, message = '') {
    let str = '';
    str += `Количество ходов: ${counter}\n\n`;
    str += `Счёт сессии:\n`;
    str += `Союзники ${winner.ally} - ${winner.enemy} Противник\n\n`;
    str += message;
    document.getElementById('rezult_textarea').value = str;
}

document.getElementById('reset').addEventListener('click', () => {
    deleteAllClass(allyTable, 'none');
    deleteAllClass(enemyTable, 'none');
    allyIndicator = new lineIndicator(0, 'icon_ally_ships', 'init_ship'); // 
    enemyIndicator = new lineIndicator(0, 'icon_enemy_ships', 'init_ship'); // 
    document.getElementById('al_st').innerHTML = '';
    document.getElementById('en_st').innerHTML = '';
    onOffField('on_off_enemy', 'off'); // 
    onOffField('on_off_ally', 'off'); // 
    document.getElementById('rev-div').classList.add('res-disable');
    document.querySelector('.first-control').classList.remove('first-control-off');
});

function setAudio(path = '', volume = 0.1) {
    if (document.getElementById('sound_off').checked) return;
    let audio = new Audio(path);
    audio.volume = volume;
    audio.play();
}

function setEmptyArea(index, field) {
    (index - 1) % 10 == 0 ? null : field[index - 1].emptyCell = true; // лево
    (index - 11) % 10 == 0 || (index - 11) < 0 ? null : field[index - 11].emptyCell = true; // лево-верх
    (index - 10) <= 0 ? null : field[index - 10].emptyCell = true; // верх
    (index - 9) <= 0 || (index - 9 - 1) % 10 == 0 ? null : field[index - 9].emptyCell = true; // право-верх
    (index + 1) > 100 || (index) % 10 == 0 ? null : field[index + 1].emptyCell = true; // право
    (index + 11) > 100 || (index + 10) % 10 == 0 ? null : field[index + 11].emptyCell = true; // право-низ
    (index + 10) > 100 ? null : field[index + 10].emptyCell = true; // низ
    (index + 9) > 100 || (index + 9) % 10 == 0 ? null : field[index + 9].emptyCell = true; // низ-лево
}

function renderField(table, field, side = '', defaultClass = 'none') {
    table.querySelectorAll('div').forEach((value, index) => {
        if (side === 'ally') {
            if (field[index + 1].ship) {
                value.classList.replace(defaultClass, 'ship');
            }
            if (field[index + 1].hit) {
                value.classList.replace('ship', 'dead_ship');
                return;
            }
        }
        if (field[index + 1].hit) {
            value.classList.replace(defaultClass, 'dead_ship');
            return;
        }
        if (field[index + 1].miss) {
            value.classList.replace(defaultClass, 'miss_target');
            return;
        }
        if (field[index + 1].emptyCell) {
            value.classList.replace(defaultClass, 'empty_cell');
            return;
        } else value.classList.replace('empty_cell', defaultClass);
    });
}
////////////////////////////////////////////////////////////////////////////////////////////

class lineIndicator {
    constructor(all = 0, indicator = '', defaultClass = '') {
        this.index = 0;
        this.all = new Array(all);
        this.indicator = document.querySelector('.' + indicator);
        this.createIndicator(defaultClass);
        this.blocks = this.indicator.querySelectorAll('div');
    }

    createIndicator(defaultClass) {
        this.indicator.querySelectorAll('div').forEach(value => value.remove())
        for (let i = 0; i < this.all.length; i++) {
            let elem = document.createElement('div');
            elem.classList.add('base_icon');
            elem.classList.add(defaultClass);
            this.indicator.appendChild(elem);
        }
    }

    changeStatus(newStatus = '') {
        this.blocks[this.index].classList.add(newStatus);
        this.blocks.length === this.index + 1 ? this.index = 0 : this.index++;
    }
}

function createRandonShips(field, ships, table) {
    ships > 15 ? ships = 15 : null;
    for (let i = 0; i < ships; i++) {
        let xy;
        let condition = true;

        while (condition) {
            xy = Math.floor(Math.random() * 100) + 1;
            if (!field[xy].ship && !field[xy].emptyCell) condition = false;
        }
        field[xy].ship = true;
        setEmptyArea(xy, field);
    }
    field.forEach((value, index) => {
        value.emptyCell = false
        if (value.ship) table.querySelectorAll('div')[index - 1].classList.add('ship');
    });
}

function deleteAllClass(table, defaultClass = 'none') {
    let elems = table.querySelectorAll('div');
    elems.forEach(val => {
        val.removeAttribute('class');
        val.classList.add(defaultClass);
    });
}

function createField(obj) {
    let arr = new Array(101)
    for (let i = 1; i <= arr.length - 1; i++) {
        arr[i] = {
            ...obj
        };
    }
    return arr;
}

function onOffField(name, action) {
    if (action === 'on') {
        document.getElementById(name).classList.replace('disable_field', 'enable_field');
    } else document.getElementById(name).classList.replace('enable_field', 'disable_field');
}

function createTable(table) {
    let index = 0;
    for (let i = 1; i <= 10; i++) {
        let str = '<tr>\n';
        for (let i = 1; i <= 10; i++) {
            index++;
            str += `<td><div class="main_behavior" data-index="${index}"></div></td>\n`
        }
        str += '</tr>';
        let elem = document.createElement('tr');
        elem.innerHTML = str;
        table.appendChild(elem)
    }
}