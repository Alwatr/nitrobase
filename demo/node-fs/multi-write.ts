import {createLogger} from '@alwatr/logger';
import {WriteFileMode, writeFile} from '@alwatr/store-engine/lib/util.js';

const logger = createLogger('node-fs/demo', true);

async function test1() {
  logger.logOther!(1);
  setTimeout(() => logger.logOther!(7));
  setImmediate(() => logger.logOther!(6));
  process.nextTick(() => logger.logOther!(5));
  Promise.resolve().then(() => logger.logOther!(3));
  await logger.logOther!(2);
  logger.logOther!(4);
}

async function test2(i = 0) {
  i++;
  logger.logOther!(`tick = ${i}`);
  if (i < 100) setImmediate(() => test2(i));
}

export function generateJunkString(length: number, char: string): string {
  // const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let junkString = '';
  for (let i = 0; i < length; i++) {
    junkString += char;
  }
  return junkString;
}

async function test3() {
  writeFile('./test.txt', generateJunkString(100_000, 'A'), WriteFileMode.Replace);
  await new Promise((resolve) => setImmediate(resolve));
  writeFile('./test.txt', generateJunkString(100_000, 'B'), WriteFileMode.Replace);
  await new Promise((resolve) => setImmediate(resolve));
  writeFile('./test.txt', generateJunkString(100_000, 'C'), WriteFileMode.Replace);
  await new Promise((resolve) => setTimeout(resolve, 3));
  writeFile('./test.txt', generateJunkString(100_000, 'D'), WriteFileMode.Replace);
  await new Promise((resolve) => setTimeout(resolve, 3));
  // throw new Error('ERROR!');
}

test1();
test2();
test3();
