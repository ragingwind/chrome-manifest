'use strict';

function version(numbers, index) {
  if (!numbers[index]) {
    throw 'Build number overflow to ' + numbers;
  }
  if (numbers[index] + 1 <= 65535) {
    numbers[index]++;
    return numbers.join('.');
  } else {
    version(numbers, ++index);
  }
}

module.exports = version;
