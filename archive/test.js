// rest operator
function hello(...e) {
  console.log(e)
}

hello('hi')


// spread operator
const adrian = {
  fullName: 'Adrian Oprea',
  occupation: 'Software developer',
  age: 31,
  website: 'https://oprea.rocks'
};

const bill = {
  ...{fullName: 'Bill Gates'}

}

console.log(bill)



var module = (function () {
  // private variables and functions
  var foo = 'bar';

  // constructor
  var module = function () {
  };

  // prototype
  module.prototype = {
    constructor: module,
    something: function () {
    }
  };

  // return module
  return module;
})();

var my_module = new module();

console.log(my_module, 'hi')

const blah = String()

blah = 'h'
