const { readFileSync } = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const showReadableErrors = () => {
  const statuses = ['Survived', 'NoCoverage'];
  let mutationsErrors, mutation;

  try {
    mutationsErrors = JSON.parse(readFileSync(join(__dirname, 'mutations-errors.json'), 'utf-8'));
  } catch (error) {
    console.log('Файл `mutations-errors.json` не найден.');
    process.exit(1);
  }

  try {
    mutation = JSON.parse(readFileSync(join(__dirname, 'reports', 'mutation', 'mutation.json'), 'utf-8'));
  } catch (error) {
    console.log('Тесты stryker упали. Убедитесь, что редактируете только файл `posts.service.spec.ts`.');
    process.exit(1);
  }

  const errors = Object.entries(mutation.files).reduce((acc, [fileName, value]) => {
    const mutants = value.mutants
      .filter(({ status }) => statuses.includes(status))
      .map((mutant) => ({
        fileName,
        startLine: mutant.location.start.line,
        startCol: mutant.location.start.column,
        endLine: mutant.location.end.line,
        endCol: mutant.location.end.column,
        error: mutationsErrors.find(({ id }) => id === mutant.id).error,
      }));

    return [...acc, ...mutants];
  }, []);

  console.log("\x1b[1;31m%s\x1b[0m", 'Ошибка в читаемом виде. Подробный вывод смотрите выше.');
  errors.forEach(({ fileName, error, startLine, endLine }) => {
    console.log(`Ошибка в файле \`${fileName}\`: ${error}. Обратите внимание на строчки с ${startLine} по ${endLine}.`);
  });
}

async function test() {
  const originalConfig = `{"$schema":"./node_modules/@stryker-mutator/core/schema/stryker-schema.json","_comment":"Thisconfigwasgeneratedusing'strykerinit'.Pleasetakealookat:https://stryker-mutator.io/docs/stryker-js/configuration/formoreinformation","packageManager":"npm","plugins":["@stryker-mutator/jest-runner"],"reporters":["html","clear-text","json"],"testRunner":"jest","jest":{"projectType":"custom","configFile":"./jest.config.json"},"coverageAnalysis":"perTest","mutate":["./src/posts.service.ts"],"thresholds":{"break":100},"concurrency":2,"mutator":{"excludedMutations":["UpdateOperator","ArrayDeclaration"]}}`;
  const config = readFileSync(join(__dirname, 'stryker.conf.json'), 'utf-8').replace(/[\n\r]/g, '').replace(/\s/g, '');

  if (config !== originalConfig) {
    throw new Error(`Не исправляйте и не удаляйте файл stryker.conf.json`)
  }

  try {
    await exec('stryker run');
  } catch (error) {
    let message = `Тесты завершились с ошибкой: ${error.message}`;
    message += error.stdout ? `\nЛоги тестов: ${error.stdout}` : '';
    message += error.stderr ? `\nКритические ошибки: ${error.stderr}` : '';
    console.log(message);
    showReadableErrors();
    process.exit(1);
  }

  console.log("Тесты пройдены");
}

test();
