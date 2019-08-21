var outputLeft = document.getElementById("outputarealeft");
var outputRight = document.getElementById("outputarearight");

// Initialize Awesomplete
var _awesompleteOpts = {
    list: cardDB().get().map(c => c.Name),  // List is all the cards in the DB
    autoFirst: true,                        // The first item in the list is selected
    filter: Awesomplete.FILTER_STARTSWITH   // Case insensitive from start of word
};
var handCompletions = {}
for (i = 1; i <= 5; i++) {
    var hand = document.getElementById("hand" + i);
    handCompletions["hand" + i] = new Awesomplete(hand, _awesompleteOpts);
}

// Creates a div for each fusion
function fusesToHTML(fuselist) {
    return fuselist.map(function (fusion) {
        var res = "<div class='result-div'>Input: " + fusion.card1.Name + " [" + cardTypes[fusion.card1.Type] + "]" + "<br>Input: " + fusion.card2.Name + " [" + cardTypes[fusion.card2.Type] + "]";
        if (fusion.result) { // Equips and Results don't have a result field
            res += "<br>Result: " + fusion.result.Name;
            if (isMonster(fusion.result)) {
                res += " " + formatStats(fusion.result.Attack, fusion.result.Defense) + " [" + cardTypes[fusion.result.Type] + "]";
            } else {
                res += " [" + cardTypes[fusion.result.Type] + "]";
            }
        }
        return res + "<br><br></div>";
    }).join("\n");
}

function getCardByName(cardname) {
    return cardDB({ Name: { isnocase: cardname } }).first();
}

// Returns the card with a given ID
function getCardById(id) {
    var card = cardDB({ Id: id }).first();
    if (!card) {
        return null;
    }
    return card;
}

function formatStats(attack, defense) {
    return "(" + attack + "/" + defense + ")";
}

// Returns true if the given card is a monster, false if it is magic, ritual,
// trap or equip
function isMonster(card) {
    return card.Type < 20;
}

function checkCard(cardname, infoname) {
    var info = $("#" + infoname);
    var card = getCardByName(cardname);
    if (!card) {
        info.html("Invalid card name");
    } else if (isMonster(card)) {
        info.html(formatStats(card.Attack, card.Defense) + " [" + cardTypes[card.Type] + "]");
    } else {
        info.html("[" + cardTypes[card.Type] + "]");
    }
}

// Checks if the given card is in the list of fusions
// Assumes the given card is an Object with an "Id" field
// TODO: Generalize to take Object, Name (string) or Id (int)
function hasFusion(fusionList, card) {
    return fusionList.some(c => c.Id === card.Id);
}

function findFusionsAndEquips(cardsArray, funsionsArray, equipsArray) {
    var fuses = [];
    var equips = [];

    for (i = 0; i < cardsArray.length - 1; i++) {
        var card1 = cardsArray[i];
        var card1Fuses = funsionsArray[card1.Id];
        var card1Equips = equipsArray[card1.Id];
        for (j = i + 1; j < cardsArray.length; j++) {
            var card2 = cardsArray[j];
            var fusion = card1Fuses.find(f => f.card === card2.Id);
            if (fusion) {
                fuses.push({ card1: card1, card2: card2, result: getCardById(fusion.result) });
            }
            var equip = card1Equips.find(e => e === card2.Id);
            if (equip) {
                equips.push({ card1: card1, card2: card2 });
            }
        }
    }

    return { fuses, equips };
}

function findFusions() {
    var cards = [];

    for (i = 1; i <= 5; i++) {
        var name = $("#hand" + i).val();
        var card = getCardByName(name);
        if (card) {
            cards.push(card);
        }
    }

    var result = findFusionsAndEquips(cards, fusionsList, equipsList);

    var fuses = result.fuses;
    var equips = result.equips;

    outputLeft.innerHTML = "<h2 class='center'>Fusions:</h2>";
    outputLeft.innerHTML += fusesToHTML(fuses.sort((a, b) => b.result.Attack - a.result.Attack));

    outputRight.innerHTML = "<h2 class='center'>Equips:</h2>";
    outputRight.innerHTML += fusesToHTML(equips);
}

function resultsClear() {
    outputLeft.innerHTML = "";
    outputRight.innerHTML = "";
}

function inputsClear() {
    for (i = 1; i <= 5; i++) {
        $("#hand" + i).val("");
        $("#hand" + i + "-info").html("");
    }
}

// Set up event listeners for each card input
for (i = 1; i <= 5; i++) {
    $("#hand" + i).on("change", function () {
        handCompletions[this.id].select(); // select the currently highlighted element
        if (this.value === "") { // If the box is cleared, remove the card info
            $("#" + this.id + "-info").html("");
        } else {
            checkCard(this.value, this.id + "-info");
        }
        resultsClear();
        findFusions();
    });

    $("#hand" + i).on("awesomplete-selectcomplete", function () {
        checkCard(this.value, this.id + "-info");
        resultsClear();
        findFusions();
    });
}

$("#resetBtn").on("click", function () {
    resultsClear();
    inputsClear();
});
