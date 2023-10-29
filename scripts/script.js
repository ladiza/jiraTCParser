document.getElementById('parseButton').addEventListener('click', () => {
    let jiraText = document.getElementById('jiraText').value;
    let parsedResults = parseTextToStepObjects(jiraText);
    let testID = getTestID(jiraText)
    let userName = getUserName(jiraText)
    displayParsedResults(parsedResults, testID, userName);
});

// funkce postupne upravi text tak aby z toho vylezla array objektu, s parametry number, action a result
function parseTextToStepObjects(inputText) {
    let trimmedText = trimText(inputText);
    let stepsArray = splitSteps(trimmedText);
    let stepObjects = []
    stepsArray.forEach( step => {
        stepObjects.push(parseStep(step))
    })
    
    return stepObjects
}

// pomoci regexu se z cele strenky odsekne cast pred testy a za testy, odstrani se prazdne radky
function trimText(text) {
    const matches = text.matchAll(/Add Step/g);
    const keywordIndexes = []

    for (const match of matches) {
        keywordIndexes.push({ startIndex: match.index, endIndex: match.index + match[0].length })
    }

    const shortenedText = text.substring(keywordIndexes[0].endIndex, keywordIndexes[1].startIndex)
    const updatedText = shortenedText.replace(/^\s*[\r\n]/gm, '');

    return updatedText;
}

// souvisly text se stepy se pomoci regexu rozdeli na array obsahujici texty jednotlivych stepu
function splitSteps(text) {
    const matches = text.matchAll(/\b\d{1,2}\nAction\b/g);
    let indexes = []
    let steps = []
    for (const match of matches) {
        indexes.push(match.index)
    }
    indexes = indexes.reverse()

    for (const index of indexes) {
        steps.push(text.slice(index))
    }

    return steps.reverse()
}

// text kazdeho stepu se vezme, vytahne se z nej cislo, akce a ocekavany vysledek, zbytek se zahodi
function parseStep(stepText) {
    const lines = stepText.split('\n')

    const actionIndex = lines.indexOf('Action');
    const dataIndex = lines.indexOf('Data');
    const resultIndex = lines.indexOf('Expected Result');
    const attachmentsIndex = lines.indexOf('Attachments (0)');

    return {
        number: parseInt(lines[0]),
        action: lines.slice(actionIndex + 1, dataIndex).join(' '),
        result: lines.slice(resultIndex + 1, attachmentsIndex).join(' ')
    }
}

// returns test ID from copied JIRA text
function getTestID(text) {
    return text.match(/QA-\d{3,6}/)
}

// slices username from the text
function getUserName(text) {
    const lines = text.split('\n')
    let line
    for (let i = 0; i < lines.length; i++) {
        line = lines[i]
        if (line.includes("User profile for")){
            line = line.split(' ').slice(3).join(' ')
            break
        }
    }
    console.log(line)
    return line
}

function displayParsedResults(parsedResults, testID, userName) {
    //console.log(parsedResults)
    let parsedStepsDiv = document.getElementById('parsedSteps');
    parsedStepsDiv.innerHTML = ''; // Clear previous results

    // append comment with name and link 
    let idParagraph = document.createElement('p');
    idParagraph.innerHTML = 
    `/**
    <br>&nbsp;* @author - ${userName}
    <br>&nbsp;* @link - https://jira.jtfg.com/browse/${testID}
    <br>&nbsp;*/`;
    parsedStepsDiv.appendChild(idParagraph);

    // append steps and results
    parsedResults.forEach( step => {
        let stepText = `// Step ${step.number}: ${step.action}`;
        let expectedResultText = `// Expected result ${step.number}: ${step.result}`;

        let stepParagraph = document.createElement('p');
        stepParagraph.textContent = stepText;
        parsedStepsDiv.appendChild(stepParagraph);

        if (step.result) {
            let expectedResultParagraph = document.createElement('p');
            expectedResultParagraph.textContent = expectedResultText;
            parsedStepsDiv.appendChild(expectedResultParagraph);
        }
    });
}