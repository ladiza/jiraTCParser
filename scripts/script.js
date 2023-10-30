document.getElementById('parseButton').addEventListener('click', () => {
  let jiraText = document.getElementById('jiraText').value;
  let results = getParsedText(jiraText);
  displayParsedResults(results);
});

document.getElementById('parsePWButton').addEventListener('click', () => {
  let jiraText = document.getElementById('jiraText').value;
  let results = getParsedText(jiraText);
  displayPlaywrightResults(results);
});

function getParsedText(jiraText) {
  return {
    parsedResults: parseTextToStepObjects(jiraText),
    testURL: getTestURL(jiraText),
    userName: getUserName(jiraText),
  };
}

// funkce postupne upravi text tak aby z toho vylezla array objektu, s parametry number, action a result
function parseTextToStepObjects(inputText) {
  let trimmedText = trimText(inputText);
  let stepsArray = splitSteps(trimmedText);
  let stepObjects = [];
  stepsArray.forEach((step) => {
    stepObjects.push(parseStep(step));
  });

  return stepObjects;
}

// pomoci regexu se z cele strenky odsekne cast pred testy a za testy, odstrani se prazdne radky
function trimText(text) {
  const matches = text.matchAll(/Add Step/g);
  const keywordIndexes = [];
  let updatedText = text;

  for (const match of matches) {
    keywordIndexes.push({
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  if (keywordIndexes.length != 0) {
    const shortenedText = text.substring(
      keywordIndexes[0].endIndex,
      keywordIndexes[1].startIndex
    );
    updatedText = shortenedText;
  }

  updatedText = updatedText.replace(/^\s*[\r\n]/gm, '');

  return updatedText;
}

// souvisly text se stepy se pomoci regexu rozdeli na array obsahujici texty jednotlivych stepu
function splitSteps(text) {
  const matches = text.matchAll(/\b\d{1,2}\nAction\b/g);
  let indexes = [];
  let steps = [];

  // pro kazdy match se zapise start index matche
  for (const match of matches) {
    indexes.push(match.index);
  }

  // by se dal "odsekavat" text, indexy se reversnou
  indexes = indexes.reverse();

  for (const index of indexes) {
    steps.push(text.slice(index));
    text = text.substring(0, index);
  }

  return steps.reverse();
}

// text kazdeho stepu se vezme, vytahne se z nej cislo, akce a ocekavany vysledek, zbytek se zahodi
function parseStep(stepText) {
  const lines = stepText.split('\n');

  const actionStart = lines.indexOf('Action');
  const actionEnd = lines.indexOf('Data');
  const resultStart = lines.indexOf('Expected Result');
  const resultEnd = lines.indexOf('Attachments');

  return {
    number: parseInt(lines[0]),
    action: lines.slice(actionStart + 1, actionEnd).join(' '),
    result: lines.slice(resultStart + 1, resultEnd).join(' '),
  };
}

// finds and returns url of the test
function getTestURL(text) {
  const testID = text.match(/QA-\d{3,6}/);
  if (testID) {
    return `https://jira.jtfg.com/browse/${testID}`;
  } else {
    return `Error: Test ID not found`;
  }
}

// slices username from the text
function getUserName(text) {
  let lines = text.split('\n');
  let line;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('User profile for')) {
      line = lines[i].split(' ').slice(3).join(' ');
      break;
    }
  }
  return line || 'Error: User not found!';
}

function displayParsedResults(result) {
  console.log(result);
  let parsedStepsDiv = document.getElementById('parsedSteps');
  parsedStepsDiv.innerHTML = ''; // Clear previous results

  // append comment with name and link
  let idParagraph = document.createElement('p');
  idParagraph.innerHTML = `/**
    <br>&nbsp;* @author - ${result.userName}
    <br>&nbsp;* @link - ${result.testURL}
    <br>&nbsp;*/`;
  parsedStepsDiv.appendChild(idParagraph);

  // append steps and results
  result.parsedResults.forEach((step) => {
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

function displayPlaywrightResults(result) {
  let parsedStepsDiv = document.getElementById('parsedSteps');
  parsedStepsDiv.innerHTML = ''; // Clear previous results

  // append comment with name and link
  let idParagraph = document.createElement('p');
  idParagraph.innerHTML = `/**
    <br>&nbsp;* @author - ${result.userName}
    <br>&nbsp;* @link - ${result.testURL}
    <br>&nbsp;*/`;
  parsedStepsDiv.appendChild(idParagraph);

  // append playwright test start
  let testStart = document.createElement('p');
  testStart.textContent = `test('${result.testURL.split('/')[-1]}', () => {`;
  parsedStepsDiv.appendChild(testStart);

  // append steps and results
  result.parsedResults.forEach((step) => {
    let stepText = `&nbsp;&nbsp;test.step('Step ${step.number}: ${step.action}', () => {
      
    }`;
    let expectedResultText = `&nbsp;&nbsp;test.step('Expected result ${step.number}: ${step.result}', () => {
      
    }`;

    let stepParagraph = document.createElement('p');
    stepParagraph.textContent = stepText;
    parsedStepsDiv.appendChild(stepParagraph);

    if (step.result) {
      let expectedResultParagraph = document.createElement('p');
      expectedResultParagraph.textContent = expectedResultText;
      parsedStepsDiv.appendChild(expectedResultParagraph);
    }
  });

  // append playwright test end
  let testEnd = document.createElement('p');
  testEnd.textContent = `});`;
  parsedStepsDiv.appendChild(testEnd);
}
